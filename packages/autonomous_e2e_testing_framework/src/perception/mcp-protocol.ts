/**
 * mcp-protocol.ts
 * Playwright Model Context Protocol (MCP) tool schema and action dispatcher.
 * Standardizes browser interactions for AI agents and test runners.
 */

export interface MCPToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string };
  required?: boolean;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPToolParameter>;
    required: string[];
  };
}

export interface MCPToolCallRequest {
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolCallResponse {
  id?: string;
  toolResult: {
    success: boolean;
    data?: unknown;
    error?: string;
    actionPerformed?: string;
    executionTimeMs?: number;
  };
}

export interface BrowserDriverAdapter {
  click(target: { elementId?: string; x?: number; y?: number }): Promise<void>;
  type(target: { elementId?: string; text: string; clearFirst?: boolean }): Promise<void>;
  touchTap(coords: { x: number; y: number }): Promise<void>;
  touchPinch(params: { centerX: number; centerY: number; initialSpan: number; finalSpan: number; durationMs?: number }): Promise<void>;
  touchPan(params: { startX: number; startY: number; endX: number; endY: number; durationMs?: number }): Promise<void>;
  scroll(params: { x?: number; y?: number; direction?: 'up' | 'down'; distance?: number }): Promise<void>;
  selectOption(params: { elementId?: string; value: string }): Promise<void>;
  evaluateScript<T>(script: string, args?: unknown[]): Promise<T>;
  getSnapshot?(): Promise<unknown>;
}

export const PLAYWRIGHT_MCP_TOOLS: MCPToolDefinition[] = [
  {
    name: 'playwright_click',
    description: 'Clicks an element specified by its compact AXTree elementId (e.g. "e1") or physical pixel coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        elementId: { type: 'string', description: 'Alphanumeric AXTree element ID (e.g. "e1", "e2")' },
        x: { type: 'number', description: 'X coordinate in viewport pixels' },
        y: { type: 'number', description: 'Y coordinate in viewport pixels' }
      },
      required: []
    }
  },
  {
    name: 'playwright_type',
    description: 'Types text into an input or textbox identified by elementId.',
    inputSchema: {
      type: 'object',
      properties: {
        elementId: { type: 'string', description: 'AXTree element ID to target' },
        text: { type: 'string', description: 'The text string to type' },
        clearFirst: { type: 'boolean', description: 'Whether to clear existing text before typing' }
      },
      required: ['text']
    }
  },
  {
    name: 'playwright_touch_tap',
    description: 'Dispatches a single touch tap event at target pixel coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'X coordinate in viewport pixels' },
        y: { type: 'number', description: 'Y coordinate in viewport pixels' }
      },
      required: ['x', 'y']
    }
  },
  {
    name: 'playwright_touch_pinch',
    description: 'Dispatches a dual-finger pinch-to-zoom gesture centered at (centerX, centerY).',
    inputSchema: {
      type: 'object',
      properties: {
        centerX: { type: 'number', description: 'Pinch center X coordinate' },
        centerY: { type: 'number', description: 'Pinch center Y coordinate' },
        initialSpan: { type: 'number', description: 'Initial span between two fingers in pixels' },
        finalSpan: { type: 'number', description: 'Final span between two fingers in pixels' },
        durationMs: { type: 'number', description: 'Gesture duration in milliseconds (default 300ms)' }
      },
      required: ['centerX', 'centerY', 'initialSpan', 'finalSpan']
    }
  },
  {
    name: 'playwright_touch_pan',
    description: 'Dispatches a touch drag-to-pan gesture from start to end coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        startX: { type: 'number', description: 'Starting X coordinate' },
        startY: { type: 'number', description: 'Starting Y coordinate' },
        endX: { type: 'number', description: 'Ending X coordinate' },
        endY: { type: 'number', description: 'Ending Y coordinate' },
        durationMs: { type: 'number', description: 'Duration in milliseconds' }
      },
      required: ['startX', 'startY', 'endX', 'endY']
    }
  },
  {
    name: 'playwright_scroll',
    description: 'Scrolls the active viewport or window.',
    inputSchema: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['up', 'down'], description: 'Scroll direction' },
        distance: { type: 'number', description: 'Distance in pixels to scroll (default 300)' },
        x: { type: 'number', description: 'Specific target scroll X' },
        y: { type: 'number', description: 'Specific target scroll Y' }
      },
      required: []
    }
  },
  {
    name: 'playwright_select_option',
    description: 'Selects a dropdown or combobox option by value or text.',
    inputSchema: {
      type: 'object',
      properties: {
        elementId: { type: 'string', description: 'AXTree element ID of the select/combobox' },
        value: { type: 'string', description: 'Option value to select' }
      },
      required: ['value']
    }
  },
  {
    name: 'playwright_evaluate',
    description: 'Evaluates a JavaScript expression in the browser page context.',
    inputSchema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'JavaScript code snippet to execute' }
      },
      required: ['script']
    }
  }
];

export class PlaywrightMCPDispatcher {
  private driver: BrowserDriverAdapter;

  constructor(driver: BrowserDriverAdapter) {
    this.driver = driver;
  }

  public listTools(): MCPToolDefinition[] {
    return PLAYWRIGHT_MCP_TOOLS;
  }

  public async dispatch(request: MCPToolCallRequest): Promise<MCPToolCallResponse> {
    const startTime = Date.now();
    const { name, arguments: args, id } = request;

    try {
      switch (name) {
        case 'playwright_click': {
          const elementId = args.elementId as string | undefined;
          const x = args.x as number | undefined;
          const y = args.y as number | undefined;
          if (!elementId && (x === undefined || y === undefined)) {
            throw new Error('playwright_click requires either elementId or (x, y) coordinates');
          }
          await this.driver.click({ elementId, x, y });
          return {
            id,
            toolResult: {
              success: true,
              actionPerformed: `click: ${elementId ? 'ID=' + elementId : `(${x},${y})`}`,
              executionTimeMs: Date.now() - startTime
            }
          };
        }

        case 'playwright_type': {
          const elementId = args.elementId as string | undefined;
          const text = args.text as string;
          const clearFirst = Boolean(args.clearFirst);
          if (text === undefined) {
            throw new Error('playwright_type requires "text" argument');
          }
          await this.driver.type({ elementId, text, clearFirst });
          return {
            id,
            toolResult: {
              success: true,
              actionPerformed: `type: "${text}" into ${elementId || 'focused'}`,
              executionTimeMs: Date.now() - startTime
            }
          };
        }

        case 'playwright_touch_tap': {
          const x = args.x as number;
          const y = args.y as number;
          if (x === undefined || y === undefined) {
            throw new Error('playwright_touch_tap requires x and y coordinates');
          }
          await this.driver.touchTap({ x, y });
          return {
            id,
            toolResult: {
              success: true,
              actionPerformed: `touch_tap: (${x}, ${y})`,
              executionTimeMs: Date.now() - startTime
            }
          };
        }

        case 'playwright_touch_pinch': {
          const centerX = args.centerX as number;
          const centerY = args.centerY as number;
          const initialSpan = args.initialSpan as number;
          const finalSpan = args.finalSpan as number;
          const durationMs = (args.durationMs as number) || 300;
          if (centerX === undefined || centerY === undefined || initialSpan === undefined || finalSpan === undefined) {
            throw new Error('playwright_touch_pinch requires centerX, centerY, initialSpan, and finalSpan');
          }
          await this.driver.touchPinch({ centerX, centerY, initialSpan, finalSpan, durationMs });
          return {
            id,
            toolResult: {
              success: true,
              actionPerformed: `touch_pinch: center=(${centerX},${centerY}), span=${initialSpan}->${finalSpan}`,
              executionTimeMs: Date.now() - startTime
            }
          };
        }

        case 'playwright_touch_pan': {
          const startX = args.startX as number;
          const startY = args.startY as number;
          const endX = args.endX as number;
          const endY = args.endY as number;
          const durationMs = (args.durationMs as number) || 300;
          if (startX === undefined || startY === undefined || endX === undefined || endY === undefined) {
            throw new Error('playwright_touch_pan requires startX, startY, endX, and endY');
          }
          await this.driver.touchPan({ startX, startY, endX, endY, durationMs });
          return {
            id,
            toolResult: {
              success: true,
              actionPerformed: `touch_pan: (${startX},${startY}) -> (${endX},${endY})`,
              executionTimeMs: Date.now() - startTime
            }
          };
        }

        case 'playwright_scroll': {
          const direction = args.direction as 'up' | 'down' | undefined;
          const distance = args.distance as number | undefined;
          const x = args.x as number | undefined;
          const y = args.y as number | undefined;
          await this.driver.scroll({ direction, distance, x, y });
          return {
            id,
            toolResult: {
              success: true,
              actionPerformed: `scroll: direction=${direction || 'none'}, dist=${distance || 0}`,
              executionTimeMs: Date.now() - startTime
            }
          };
        }

        case 'playwright_select_option': {
          const elementId = args.elementId as string | undefined;
          const value = args.value as string;
          if (!value) throw new Error('playwright_select_option requires "value"');
          await this.driver.selectOption({ elementId, value });
          return {
            id,
            toolResult: {
              success: true,
              actionPerformed: `select: value="${value}" in ${elementId || 'target'}`,
              executionTimeMs: Date.now() - startTime
            }
          };
        }

        case 'playwright_evaluate': {
          const script = args.script as string;
          if (!script) throw new Error('playwright_evaluate requires "script"');
          const result = await this.driver.evaluateScript(script);
          return {
            id,
            toolResult: {
              success: true,
              data: result,
              actionPerformed: `evaluateScript: length=${script.length}`,
              executionTimeMs: Date.now() - startTime
            }
          };
        }

        default:
          throw new Error(`Unknown MCP Tool: ${name}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        id,
        toolResult: {
          success: false,
          error: errorMessage,
          executionTimeMs: Date.now() - startTime
        }
      };
    }
  }
}

/**
 * In-memory Mock Driver for deterministic unit testing of the MCP layer.
 */
export class MockBrowserDriver implements BrowserDriverAdapter {
  public actionLog: Array<{ action: string; params: unknown }> = [];

  async click(target: { elementId?: string; x?: number; y?: number }): Promise<void> {
    this.actionLog.push({ action: 'click', params: target });
  }

  async type(target: { elementId?: string; text: string; clearFirst?: boolean }): Promise<void> {
    this.actionLog.push({ action: 'type', params: target });
  }

  async touchTap(coords: { x: number; y: number }): Promise<void> {
    this.actionLog.push({ action: 'touchTap', params: coords });
  }

  async touchPinch(params: { centerX: number; centerY: number; initialSpan: number; finalSpan: number; durationMs?: number }): Promise<void> {
    this.actionLog.push({ action: 'touchPinch', params });
  }

  async touchPan(params: { startX: number; startY: number; endX: number; endY: number; durationMs?: number }): Promise<void> {
    this.actionLog.push({ action: 'touchPan', params });
  }

  async scroll(params: { x?: number; y?: number; direction?: 'up' | 'down'; distance?: number }): Promise<void> {
    this.actionLog.push({ action: 'scroll', params });
  }

  async selectOption(params: { elementId?: string; value: string }): Promise<void> {
    this.actionLog.push({ action: 'selectOption', params });
  }

  async evaluateScript<T>(script: string, _args?: unknown[]): Promise<T> {
    this.actionLog.push({ action: 'evaluateScript', params: { script } });
    if (script.includes('return 42')) return 42 as unknown as T;
    return true as unknown as T;
  }
}
