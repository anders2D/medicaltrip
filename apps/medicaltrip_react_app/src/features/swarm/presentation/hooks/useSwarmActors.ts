/**
 * Medical Trip Colombia S.A.S. - useSwarmActors Hook
 * React hook for orchestrating decentralized Web Worker Actors,
 * dispatching domain tasks, streaming SHA-256 ledger integrity, and tracking live CRDT metrics.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ActorPool, SwarmStatusInfo } from '../../infrastructure/actorPool';
import { ActorRole, ActorMessage } from '../../domain/IActorEventBusPort';
import { DriverFareRequest, DriverFareResult, DistanceCalculationRequest, DistanceCalculationResult, RouteValidationRequest, RouteValidationResult } from '../../infrastructure/driverActor.worker';
import { GuideHoursFeeRequest, GuideHoursFeeResult, LanguageMatchingRequest, LanguageMatchingResult } from '../../infrastructure/guideActor.worker';
import { FastingWindowRequest, FastingWindowResult, HomeSampleRequest, HomeSampleResult, PreOpChecklistRequest, PreOpChecklistResult } from '../../infrastructure/nurseActor.worker';
import { AuditSettlementRequest, AuditSettlementResult, CreateBlockRequest, VerifyChainRequest, SignSealRequest } from '../../infrastructure/financialAuditorActor.worker';
import { LedgerBlock, LedgerVerificationResult, LedgerSealCertificate } from '@/features/settlement';

export function useSwarmActors() {
  const pool = useMemo(() => ActorPool.getInstance(), []);
  const [statusInfo, setStatusInfo] = useState<SwarmStatusInfo>(() => pool.getStatus());
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [lastAuditResult, setLastAuditResult] = useState<AuditSettlementResult | null>(null);

  // Poll / refresh status
  const refreshStatus = useCallback(() => {
    setStatusInfo(pool.getStatus());
  }, [pool]);

  useEffect(() => {
    const interval = setInterval(refreshStatus, 2000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  // Generic task dispatcher
  const dispatchTask = useCallback(
    async <TReq, TRes>(targetActor: ActorRole, action: string, data: TReq): Promise<TRes> => {
      setIsExecuting(true);
      try {
        const result = await pool.dispatchTask<TReq, TRes>(targetActor, action, data);
        refreshStatus();
        return result;
      } finally {
        setIsExecuting(false);
      }
    },
    [pool, refreshStatus]
  );

  // Driver Actor Shortcuts
  const calculateFare = useCallback(
    async (req: DriverFareRequest): Promise<DriverFareResult> => {
      return dispatchTask<DriverFareRequest, DriverFareResult>('DRV_ACTOR', 'CALCULATE_FARE', req);
    },
    [dispatchTask]
  );

  const calculateDistance = useCallback(
    async (req: DistanceCalculationRequest): Promise<DistanceCalculationResult> => {
      return dispatchTask<DistanceCalculationRequest, DistanceCalculationResult>('DRV_ACTOR', 'CALCULATE_DISTANCE', req);
    },
    [dispatchTask]
  );

  const validateRoute = useCallback(
    async (req: RouteValidationRequest): Promise<RouteValidationResult> => {
      return dispatchTask<RouteValidationRequest, RouteValidationResult>('DRV_ACTOR', 'VALIDATE_ROUTE', req);
    },
    [dispatchTask]
  );

  // Guide Actor Shortcuts
  const calculateGuideFee = useCallback(
    async (req: GuideHoursFeeRequest): Promise<GuideHoursFeeResult> => {
      return dispatchTask<GuideHoursFeeRequest, GuideHoursFeeResult>('GUIA_ACTOR', 'CALCULATE_HOURS_FEE', req);
    },
    [dispatchTask]
  );

  const matchGuideLanguage = useCallback(
    async (req: LanguageMatchingRequest): Promise<LanguageMatchingResult> => {
      return dispatchTask<LanguageMatchingRequest, LanguageMatchingResult>('GUIA_ACTOR', 'MATCH_LANGUAGE', req);
    },
    [dispatchTask]
  );

  // Nurse Actor Shortcuts
  const calculateFastingWindow = useCallback(
    async (req: FastingWindowRequest): Promise<FastingWindowResult> => {
      return dispatchTask<FastingWindowRequest, FastingWindowResult>('NURSE_ACTOR', 'CALCULATE_FASTING_WINDOW', req);
    },
    [dispatchTask]
  );

  const scheduleHomeSample = useCallback(
    async (req: HomeSampleRequest): Promise<HomeSampleResult> => {
      return dispatchTask<HomeSampleRequest, HomeSampleResult>('NURSE_ACTOR', 'SCHEDULE_HOME_SAMPLE', req);
    },
    [dispatchTask]
  );

  const validatePreOpChecklist = useCallback(
    async (req: PreOpChecklistRequest): Promise<PreOpChecklistResult> => {
      return dispatchTask<PreOpChecklistRequest, PreOpChecklistResult>('NURSE_ACTOR', 'VALIDATE_PREOP_CHECKLIST', req);
    },
    [dispatchTask]
  );

  // Financial Auditor Actor Shortcuts
  const auditSettlement = useCallback(
    async (req: AuditSettlementRequest): Promise<AuditSettlementResult> => {
      const res = await dispatchTask<AuditSettlementRequest, AuditSettlementResult>('FIN_ACTOR', 'AUDIT_SETTLEMENT', req);
      setLastAuditResult(res);
      return res;
    },
    [dispatchTask]
  );

  const createLedgerBlock = useCallback(
    async (req: CreateBlockRequest): Promise<LedgerBlock> => {
      return dispatchTask<CreateBlockRequest, LedgerBlock>('FIN_ACTOR', 'CREATE_LEDGER_BLOCK', req);
    },
    [dispatchTask]
  );

  const verifyLedgerChain = useCallback(
    async (blocks: LedgerBlock[]): Promise<LedgerVerificationResult> => {
      return dispatchTask<VerifyChainRequest, LedgerVerificationResult>('FIN_ACTOR', 'VERIFY_LEDGER_CHAIN', { blocks });
    },
    [dispatchTask]
  );

  const signLedgerSeal = useCallback(
    async (patientId: string, signatureDataUrl: string): Promise<LedgerSealCertificate> => {
      return dispatchTask<SignSealRequest, LedgerSealCertificate>('FIN_ACTOR', 'SIGN_LEDGER_SEAL', {
        patientId,
        signatureDataUrl,
      });
    },
    [dispatchTask]
  );

  // Event Subscription Helper
  const subscribeToActor = useCallback(
    <T>(recipient: ActorRole, messageType: string, handler: (message: ActorMessage<T>) => void) => {
      return pool.subscribe<T>(recipient, messageType, handler);
    },
    [pool]
  );

  return {
    statusInfo,
    actorStatuses: statusInfo.actors,
    isExecuting,
    lastAuditResult,
    refreshStatus,
    dispatchTask,
    // Specialized actor methods
    calculateFare,
    calculateDistance,
    validateRoute,
    calculateGuideFee,
    matchGuideLanguage,
    calculateFastingWindow,
    scheduleHomeSample,
    validatePreOpChecklist,
    auditSettlement,
    createLedgerBlock,
    verifyLedgerChain,
    signLedgerSeal,
    subscribeToActor,
  };
}
