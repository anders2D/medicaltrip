/**
 * dom-trimmer.ts
 * Stagehand-style semantic DOM trimming and AXTree extraction engine.
 * Prunes non-interactive, invisible, and offscreen nodes.
 * Assigns compact alphanumeric IDs [e1]...[eN] to compress snapshots
 * to an ultra-low token budget (200-400 tokens/snapshot).
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AXElementNode {
  elementId: string; // e.g. "e1", "e2"
  role: string;      // e.g. "button", "textbox", "combobox", "canvas", "checkbox"
  name: string;      // Accessible name / label
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  focused?: boolean;
  checked?: boolean;
  expanded?: boolean;
  selected?: boolean;
  href?: string;
  tagName: string;
  boundingBox: BoundingBox;
  selectorPath?: string;
  isCanvasOrVisual?: boolean;
}

export interface CompactAXSnapshot {
  timestamp: string;
  tokenCount: number;
  interactiveElements: AXElementNode[];
  summaryText: string;
  viewport: { width: number; height: number };
  rawTrimRatio: number; // Ratio of reduced size vs original
}

export interface TrimmerOptions {
  viewport?: { width: number; height: number };
  maxTokens?: number; // Target token budget (default 400)
  includeInvisible?: boolean;
  filterOffscreen?: boolean;
}

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
const INTERACTIVE_ROLES = new Set([
  'button', 'textbox', 'combobox', 'checkbox', 'radio', 'switch',
  'link', 'tab', 'menuitem', 'option', 'searchbox', 'slider',
  'spinbutton', 'canvas', 'svg', 'treeitem', 'dialog', 'alertdialog'
]);

const INTERACTIVE_TAGS = new Set([
  'button', 'input', 'select', 'textarea', 'a', 'canvas', 'svg',
  'summary', 'details', 'dialog'
]);

/**
 * Parses raw HTML string into a lightweight structured DOM node representation.
 */
export interface RawDOMNode {
  tagName: string;
  attributes: Record<string, string>;
  textContent: string;
  children: RawDOMNode[];
  style?: Record<string, string>;
  boundingBox?: BoundingBox;
}

/**
 * Fast regex-based / recursive HTML tokenizer and tree builder for headless environments.
 */
export function parseHTMLToDOMTree(html: string): RawDOMNode {
  // Normalize whitespace
  const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, '').trim();

  // Root synthetic container
  const root: RawDOMNode = {
    tagName: 'root',
    attributes: {},
    textContent: '',
    children: []
  };

  // Stack for tree construction
  const stack: RawDOMNode[] = [root];
  const tagRegex = /<(\/)?([a-zA-Z0-9\-]+)([^>]*)>|([^<]+)/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(cleanHtml)) !== null) {
    const [_, isClosing, rawTagName, attrString, text] = match;

    if (text) {
      const trimmedText = text.trim();
      if (trimmedText && stack.length > 0) {
        const current = stack[stack.length - 1];
        current.textContent += (current.textContent ? ' ' : '') + trimmedText;
      }
      continue;
    }

    const tagName = rawTagName.toLowerCase();

    if (isClosing) {
      // Find matching tag in stack and pop
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tagName === tagName) {
          stack.splice(i);
          break;
        }
      }
    } else {
      // Parse attributes
      const attributes: Record<string, string> = {};
      const attrRegex = /([a-zA-Z0-9\-:@]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
      let attrMatch: RegExpExecArray | null;
      if (attrString) {
        while ((attrMatch = attrRegex.exec(attrString)) !== null) {
          const key = attrMatch[1].toLowerCase();
          const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
          attributes[key] = val;
        }
      }

      // Parse inline styles
      const style: Record<string, string> = {};
      if (attributes['style']) {
        attributes['style'].split(';').forEach(decl => {
          const [prop, val] = decl.split(':').map(s => s.trim());
          if (prop && val) style[prop.toLowerCase()] = val.toLowerCase();
        });
      }

      // Estimate / synthesize bounding box from attributes or fallback
      const x = parseFloat(attributes['data-x'] || attributes['x'] || '0') || 0;
      const y = parseFloat(attributes['data-y'] || attributes['y'] || '0') || 0;
      const width = parseFloat(attributes['data-w'] || attributes['width'] || '100') || 100;
      const height = parseFloat(attributes['data-h'] || attributes['height'] || '30') || 30;

      const node: RawDOMNode = {
        tagName,
        attributes,
        textContent: '',
        children: [],
        style,
        boundingBox: { x, y, width, height }
      };

      if (stack.length > 0) {
        stack[stack.length - 1].children.push(node);
      }

      // Self-closing tags (void elements)
      const voidTags = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']);
      if (!voidTags.has(tagName) && !attrString?.endsWith('/')) {
        stack.push(node);
      }
    }
  }

  return root;
}

/**
 * Checks if a node is visible based on styles and bounding box.
 */
export function isNodeVisible(node: RawDOMNode, viewport = DEFAULT_VIEWPORT): boolean {
  if (node.attributes['aria-hidden'] === 'true') return false;
  if (node.attributes['hidden'] !== undefined) return false;

  const style = node.style || {};
  if (style['display'] === 'none') return false;
  if (style['visibility'] === 'hidden' || style['visibility'] === 'collapse') return false;
  if (style['opacity'] === '0' || style['opacity'] === '0.0') return false;

  const bbox = node.boundingBox;
  if (bbox) {
    if (bbox.width <= 0 || bbox.height <= 0) return false;
    // Check if totally off-screen
    if (bbox.x + bbox.width < 0 || bbox.y + bbox.height < 0) return false;
    if (bbox.x > viewport.width || bbox.y > viewport.height) return false;
  }

  return true;
}

/**
 * Infers accessibility role from tag and ARIA attributes.
 */
export function inferRole(node: RawDOMNode): string {
  if (node.attributes['role']) return node.attributes['role'].toLowerCase();

  switch (node.tagName) {
    case 'button':
      return 'button';
    case 'input': {
      const type = (node.attributes['type'] || 'text').toLowerCase();
      if (type === 'button' || type === 'submit' || type === 'reset') return 'button';
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'search') return 'searchbox';
      return 'textbox';
    }
    case 'select':
      return 'combobox';
    case 'textarea':
      return 'textbox';
    case 'a':
      return node.attributes['href'] ? 'link' : 'generic';
    case 'canvas':
      return 'canvas';
    case 'svg':
      return 'svg';
    case 'dialog':
      return 'dialog';
    default:
      return 'generic';
  }
}

/**
 * Extracts accessible name / label according to WAI-ARIA naming hierarchy.
 */
export function getAccessibleName(node: RawDOMNode): string {
  if (node.attributes['aria-label']) return node.attributes['aria-label'].trim();
  if (node.attributes['title']) return node.attributes['title'].trim();
  if (node.attributes['placeholder']) return node.attributes['placeholder'].trim();
  if (node.attributes['alt']) return node.attributes['alt'].trim();
  if (node.textContent) return node.textContent.trim();
  if (node.attributes['value']) return node.attributes['value'].trim();
  if (node.attributes['name']) return node.attributes['name'].trim();
  if (node.attributes['id']) return node.attributes['id'].trim();
  return '';
}

/**
 * Stagehand DOM Trimming Pipeline:
 * Recursively visits DOM tree, trims non-interactive/invisible nodes,
 * extracts AXTree elements, and assigns alphanumeric IDs [e1], [e2]...
 */
export function extractAXTree(
  root: RawDOMNode,
  options: TrimmerOptions = {}
): AXElementNode[] {
  const viewport = options.viewport || DEFAULT_VIEWPORT;
  const elements: AXElementNode[] = [];
  let elementCounter = 1;

  function traverse(node: RawDOMNode, currentPath: string) {
    if (node.tagName !== 'root' && !isNodeVisible(node, viewport)) {
      return; // Prune branch completely
    }

    const role = inferRole(node);
    const isInteractive = INTERACTIVE_ROLES.has(role) ||
      INTERACTIVE_TAGS.has(node.tagName) ||
      node.attributes['tabindex'] !== undefined ||
      node.attributes['onclick'] !== undefined;

    const name = getAccessibleName(node);
    const isCanvasOrVisual = node.tagName === 'canvas' || node.tagName === 'svg';

    if (isInteractive || isCanvasOrVisual || (name.length > 0 && role !== 'generic')) {
      const elementId = `e${elementCounter++}`;
      const bbox: BoundingBox = node.boundingBox || { x: 0, y: 0, width: 100, height: 30 };

      const axNode: AXElementNode = {
        elementId,
        role,
        name,
        tagName: node.tagName,
        boundingBox: bbox,
        selectorPath: `${currentPath}/${node.tagName}${node.attributes['id'] ? '#' + node.attributes['id'] : ''}`,
        isCanvasOrVisual
      };

      if (node.attributes['value'] !== undefined) axNode.value = node.attributes['value'];
      if (node.attributes['placeholder']) axNode.placeholder = node.attributes['placeholder'];
      if (node.attributes['disabled'] !== undefined) axNode.disabled = true;
      if (node.attributes['aria-disabled'] === 'true') axNode.disabled = true;
      if (node.attributes['checked'] !== undefined || node.attributes['aria-checked'] === 'true') axNode.checked = true;
      if (node.attributes['aria-expanded'] === 'true') axNode.expanded = true;
      if (node.attributes['aria-selected'] === 'true') axNode.selected = true;
      if (node.attributes['href']) axNode.href = node.attributes['href'];

      elements.push(axNode);
    }

    // Traverse children
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childPath = `${currentPath}/${child.tagName}[${i}]`;
      traverse(child, childPath);
    }
  }

  traverse(root, '');
  return elements;
}

/**
 * Compresses extracted AXTree into an ultra-compact formatted string targeting 200-400 tokens.
 */
export function compressToTokenBudget(
  elements: AXElementNode[],
  maxTokens: number = 400
): { summaryText: string; estimatedTokens: number; keptElements: AXElementNode[] } {
  const lines: string[] = [];
  const keptElements: AXElementNode[] = [];

  for (const el of elements) {
    let line = `[${el.elementId}] ${el.role}`;
    if (el.name) line += ` "${el.name}"`;
    if (el.value) line += ` val="${el.value}"`;
    if (el.placeholder) line += ` placeholder="${el.placeholder}"`;
    if (el.disabled) line += ` [disabled]`;
    if (el.checked) line += ` [checked]`;
    if (el.expanded) line += ` [expanded]`;
    if (el.isCanvasOrVisual) line += ` [visual-surface]`;
    line += ` @(${Math.round(el.boundingBox.x)},${Math.round(el.boundingBox.y)},${Math.round(el.boundingBox.width)}x${Math.round(el.boundingBox.height)})`;

    // Rough token heuristic: 1 token ~= 4 chars of structured text
    const projectedTokens = Math.ceil((lines.join('\n') + '\n' + line).length / 4);
    if (projectedTokens > maxTokens && lines.length > 5) {
      lines.push(`... [trimmed ${elements.length - keptElements.length} additional nodes to fit token budget]`);
      break;
    }

    lines.push(line);
    keptElements.push(el);
  }

  const summaryText = lines.join('\n');
  const estimatedTokens = Math.ceil(summaryText.length / 4);

  return { summaryText, estimatedTokens, keptElements };
}

/**
 * Main Stagehand DOM Trimming Entry Point.
 */
export function trimDOM(rawHtml: string, options: TrimmerOptions = {}): CompactAXSnapshot {
  const maxTokens = options.maxTokens || 400;
  const viewport = options.viewport || DEFAULT_VIEWPORT;

  const parsedRoot = parseHTMLToDOMTree(rawHtml);
  const allElements = extractAXTree(parsedRoot, options);
  const { summaryText, estimatedTokens, keptElements } = compressToTokenBudget(allElements, maxTokens);

  const rawSize = rawHtml.length || 1;
  const compressedSize = summaryText.length;
  const rawTrimRatio = Number((1 - compressedSize / rawSize).toFixed(4));

  return {
    timestamp: new Date().toISOString(),
    tokenCount: estimatedTokens,
    interactiveElements: keptElements,
    summaryText,
    viewport,
    rawTrimRatio
  };
}
