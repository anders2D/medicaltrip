/**
 * bpmn-translator.ts
 * BPMN 2.0 to Workflow Timed Stochastic Petri Net (WPTSPN) Translator.
 * Maps Sequence, XOR-Split, XOR-Join, AND-Split, AND-Join, and Loop constructs.
 */

import { PetriNet, PetriPlace, PetriTransition } from './petri-net.js';

export type BPMNElementType =
  | 'startEvent'
  | 'endEvent'
  | 'task'
  | 'userTask'
  | 'serviceTask'
  | 'exclusiveGateway' // XOR
  | 'parallelGateway'  // AND
  | 'inclusiveGateway';

export interface BPMNNode {
  id: string;
  name: string;
  type: BPMNElementType;
  incoming: string[];
  outgoing: string[];
  defaultFlow?: string;
  rate?: number;
  delayInterval?: [number, number];
}

export interface BPMNSequenceFlow {
  id: string;
  sourceRef: string;
  targetRef: string;
  name?: string;
  conditionExpression?: string;
}

export interface BPMNProcessDefinition {
  id: string;
  name: string;
  nodes: BPMNNode[];
  sequenceFlows: BPMNSequenceFlow[];
}

/**
 * Translates structured BPMN Process Definition into a Workflow Petri Net.
 */
export function translateBpmnProcessToPetriNet(process: BPMNProcessDefinition): PetriNet {
  const net = new PetriNet();
  const flowsBySource = new Map<string, BPMNSequenceFlow[]>();
  const flowsByTarget = new Map<string, BPMNSequenceFlow[]>();

  process.sequenceFlows.forEach(flow => {
    if (!flowsBySource.has(flow.sourceRef)) flowsBySource.set(flow.sourceRef, []);
    flowsBySource.get(flow.sourceRef)!.push(flow);

    if (!flowsByTarget.has(flow.targetRef)) flowsByTarget.set(flow.targetRef, []);
    flowsByTarget.get(flow.targetRef)!.push(flow);
  });

  // Find start and end events
  const startNodes = process.nodes.filter(n => n.type === 'startEvent');
  const endNodes = process.nodes.filter(n => n.type === 'endEvent');

  if (startNodes.length === 0) {
    throw new Error(`BPMN Process "${process.id}" has no StartEvent.`);
  }

  // Create start place
  const startPlaceId = `p_start_${process.id}`;
  net.addPlace({ id: startPlaceId, label: 'Start Place', isInitial: true });
  net.setInitialPlace(startPlaceId);

  // Create end place
  const endPlaceId = `p_end_${process.id}`;
  net.addPlace({ id: endPlaceId, label: 'End Place', isFinal: true });
  net.setFinalPlace(endPlaceId);

  // For every sequence flow, we map a connecting Place in the Petri Net
  process.sequenceFlows.forEach(flow => {
    const placeId = `p_flow_${flow.id}`;
    const label = flow.name ? `Flow: ${flow.name}` : `Flow ${flow.id}`;
    net.addPlace({ id: placeId, label });
  });

  // Map Nodes to Transitions / Complex Gateway Subnets
  process.nodes.forEach(node => {
    const outgoingFlows = flowsBySource.get(node.id) || [];
    const incomingFlows = flowsByTarget.get(node.id) || [];

    switch (node.type) {
      case 'startEvent': {
        const startTransId = `t_start_${node.id}`;
        net.addTransition({
          id: startTransId,
          label: node.name || 'Start Process',
          isSilent: true
        });
        net.addArc(startPlaceId, startTransId);
        outgoingFlows.forEach(flow => {
          net.addArc(startTransId, `p_flow_${flow.id}`);
        });
        break;
      }

      case 'endEvent': {
        const endTransId = `t_end_${node.id}`;
        net.addTransition({
          id: endTransId,
          label: node.name || 'End Process',
          isSilent: true
        });
        incomingFlows.forEach(flow => {
          net.addArc(`p_flow_${flow.id}`, endTransId);
        });
        net.addArc(endTransId, endPlaceId);
        break;
      }

      case 'task':
      case 'userTask':
      case 'serviceTask': {
        const transId = `t_${node.id}`;
        net.addTransition({
          id: transId,
          label: node.name || `Task ${node.id}`,
          rate: node.rate ?? 1.0,
          delayInterval: node.delayInterval ?? [10, 50]
        });
        incomingFlows.forEach(flow => {
          net.addArc(`p_flow_${flow.id}`, transId);
        });
        outgoingFlows.forEach(flow => {
          net.addArc(transId, `p_flow_${flow.id}`);
        });
        break;
      }

      case 'exclusiveGateway': {
        // XOR Split or XOR Join
        if (outgoingFlows.length > 1 && incomingFlows.length <= 1) {
          // XOR-Split: 1 input place branching into N transitions
          const inputFlowId = incomingFlows[0]?.id;
          const inputPlace = inputFlowId ? `p_flow_${inputFlowId}` : startPlaceId;

          outgoingFlows.forEach((outFlow, idx) => {
            const branchTransId = `t_xor_split_${node.id}_branch_${idx}`;
            net.addTransition({
              id: branchTransId,
              label: outFlow.name || `Branch ${idx}`,
              rate: 1.0 / outgoingFlows.length
            });
            net.addArc(inputPlace, branchTransId);
            net.addArc(branchTransId, `p_flow_${outFlow.id}`);
          });
        } else if (incomingFlows.length > 1 && outgoingFlows.length <= 1) {
          // XOR-Join: N incoming transitions to 1 output place
          const outFlowId = outgoingFlows[0]?.id;
          const outPlace = outFlowId ? `p_flow_${outFlowId}` : endPlaceId;

          incomingFlows.forEach((inFlow, idx) => {
            const joinTransId = `t_xor_join_${node.id}_in_${idx}`;
            net.addTransition({
              id: joinTransId,
              label: `XOR Join In ${idx}`,
              isSilent: true
            });
            net.addArc(`p_flow_${inFlow.id}`, joinTransId);
            net.addArc(joinTransId, outPlace);
          });
        } else {
          // General N-to-M XOR gateway
          const internalPlace = `p_xor_hub_${node.id}`;
          net.addPlace({ id: internalPlace, label: `XOR Hub ${node.id}` });

          incomingFlows.forEach((inFlow, idx) => {
            const inTrans = `t_xor_in_${node.id}_${idx}`;
            net.addTransition({ id: inTrans, label: `XOR in ${idx}`, isSilent: true });
            net.addArc(`p_flow_${inFlow.id}`, inTrans);
            net.addArc(inTrans, internalPlace);
          });

          outgoingFlows.forEach((outFlow, idx) => {
            const outTrans = `t_xor_out_${node.id}_${idx}`;
            net.addTransition({ id: outTrans, label: `XOR out ${idx}`, isSilent: true });
            net.addArc(internalPlace, outTrans);
            net.addArc(outTrans, `p_flow_${outFlow.id}`);
          });
        }
        break;
      }

      case 'parallelGateway': {
        // AND Split or AND Join
        if (outgoingFlows.length > 1 && incomingFlows.length <= 1) {
          // AND-Split (Fork): 1 transition producing tokens into all output places
          const inputFlowId = incomingFlows[0]?.id;
          const inputPlace = inputFlowId ? `p_flow_${inputFlowId}` : startPlaceId;
          const forkTransId = `t_and_fork_${node.id}`;

          net.addTransition({
            id: forkTransId,
            label: node.name || 'AND Fork',
            isSilent: true
          });
          net.addArc(inputPlace, forkTransId);

          outgoingFlows.forEach(outFlow => {
            net.addArc(forkTransId, `p_flow_${outFlow.id}`);
          });
        } else if (incomingFlows.length > 1 && outgoingFlows.length <= 1) {
          // AND-Join (Synchronization): 1 transition consuming tokens from all input places
          const outFlowId = outgoingFlows[0]?.id;
          const outPlace = outFlowId ? `p_flow_${outFlowId}` : endPlaceId;
          const joinTransId = `t_and_join_${node.id}`;

          net.addTransition({
            id: joinTransId,
            label: node.name || 'AND Join',
            isSilent: true
          });

          incomingFlows.forEach(inFlow => {
            net.addArc(`p_flow_${inFlow.id}`, joinTransId);
          });
          net.addArc(joinTransId, outPlace);
        } else {
          // General AND gateway
          const andTransId = `t_and_${node.id}`;
          net.addTransition({ id: andTransId, label: node.name || 'AND Gateway', isSilent: true });
          incomingFlows.forEach(inFlow => {
            net.addArc(`p_flow_${inFlow.id}`, andTransId);
          });
          outgoingFlows.forEach(outFlow => {
            net.addArc(andTransId, `p_flow_${outFlow.id}`);
          });
        }
        break;
      }
    }
  });

  return net;
}

/**
 * Parses BPMN 2.0 XML string into BPMNProcessDefinition.
 */
export function parseBPMNXML(xmlContent: string): BPMNProcessDefinition {
  const nodes: BPMNNode[] = [];
  const sequenceFlows: BPMNSequenceFlow[] = [];

  // Match sequence flows
  const flowRegex = /<(?:bpmn:)?sequenceFlow\s+id="([^"]+)"\s+sourceRef="([^"]+)"\s+targetRef="([^"]+)"(?:[^>]*name="([^"]*)")?[^>]*\/>/g;
  let match: RegExpExecArray | null;
  while ((match = flowRegex.exec(xmlContent)) !== null) {
    sequenceFlows.push({
      id: match[1],
      sourceRef: match[2],
      targetRef: match[3],
      name: match[4]
    });
  }

  // Helper to extract node blocks
  const parseElement = (tag: string, type: BPMNElementType) => {
    const nodeRegex = new RegExp(`<(?:bpmn:)?${tag}\\s+id="([^"]+)"(?:[^>]*name="([^"]*)")?[^>]*>([\\s\\S]*?)<\\/(?:bpmn:)?${tag}>|<(?:bpmn:)?${tag}\\s+id="([^"]+)"(?:[^>]*name="([^"]*)")?[^>]*\\/>`, 'g');
    let nMatch: RegExpExecArray | null;
    while ((nMatch = nodeRegex.exec(xmlContent)) !== null) {
      const id = nMatch[1] || nMatch[3];
      const name = nMatch[2] || nMatch[4] || '';
      const body = nMatch[3] || '';

      const incoming: string[] = [];
      const outgoing: string[] = [];

      const inRegex = /<(?:bpmn:)?incoming>([^<]+)<\/(?:bpmn:)?incoming>/g;
      let inM: RegExpExecArray | null;
      while ((inM = inRegex.exec(body)) !== null) {
        incoming.push(inM[1].trim());
      }

      const outRegex = /<(?:bpmn:)?outgoing>([^<]+)<\/(?:bpmn:)?outgoing>/g;
      let outM: RegExpExecArray | null;
      while ((outM = outRegex.exec(body)) !== null) {
        outgoing.push(outM[1].trim());
      }

      nodes.push({ id, name, type, incoming, outgoing });
    }
  };

  parseElement('startEvent', 'startEvent');
  parseElement('endEvent', 'endEvent');
  parseElement('task', 'task');
  parseElement('userTask', 'userTask');
  parseElement('serviceTask', 'serviceTask');
  parseElement('exclusiveGateway', 'exclusiveGateway');
  parseElement('parallelGateway', 'parallelGateway');

  return {
    id: 'process_extracted',
    name: 'Extracted BPMN 2.0 Process',
    nodes,
    sequenceFlows
  };
}

/**
 * Convenient facade to convert either XML string or Process Definition to Petri Net.
 */
export function translateBpmnToPetriNet(input: string | BPMNProcessDefinition): PetriNet {
  if (typeof input === 'string') {
    const parsed = parseBPMNXML(input);
    return translateBpmnProcessToPetriNet(parsed);
  }
  return translateBpmnProcessToPetriNet(input);
}
