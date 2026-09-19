import { DomainError } from '../../domain/errors/domain-error.js';

/**
 * Canvas Digital Signature Hardware Adapter.
 * Captures patient digital signatures via touch, pen, or pointer with smooth Bézier curve interpolation,
 * multi-level undo/redo, vector SVG export, and high-resolution PNG rasterization.
 */
export class CanvasSignatureAdapter {
  /**
   * @param {object} [options]
   * @param {string} [options.strokeColor='#0F172A']
   * @param {number} [options.strokeWidth=2.5]
   * @param {string} [options.backgroundColor='transparent']
   * @param {number} [options.width=400]
   * @param {number} [options.height=200]
   */
  constructor(options = {}) {
    this.strokeColor = options.strokeColor || '#0F172A';
    this.strokeWidth = options.strokeWidth || 2.5;
    this.backgroundColor = options.backgroundColor || 'transparent';
    this.width = options.width || 400;
    this.height = options.height || 200;

    /** @type {Array<Array<{ x: number, y: number, pressure: number, time: number }>>} */
    this._strokes = [];
    /** @type {Array<Array<{ x: number, y: number, pressure: number, time: number }>>} */
    this._undoStack = [];
    /** @type {Array<{ x: number, y: number, pressure: number, time: number }> | null} */
    this._currentStroke = null;

    this._canvas = null;
    this._ctx = null;
    this._dpr = 1;
    this._isDrawing = false;
  }

  /**
   * Attaches an HTMLCanvasElement and configures 2D drawing context with high-DPI scaling.
   * @param {HTMLCanvasElement} canvasElement
   */
  attachCanvas(canvasElement) {
    if (!canvasElement) {
      throw new DomainError('[Signature Adapter] canvasElement es obligatorio.');
    }
    this._canvas = canvasElement;
    this._ctx = canvasElement.getContext ? canvasElement.getContext('2d') : null;

    if (typeof window !== 'undefined') {
      this._dpr = window.devicePixelRatio || 1;
    }

    if (this._canvas && this._ctx) {
      // Set display and buffer sizes for retina sharpness
      this._canvas.width = this.width * this._dpr;
      this._canvas.height = this.height * this._dpr;
      this._canvas.style.width = `${this.width}px`;
      this._canvas.style.height = `${this.height}px`;

      this._ctx.scale(this._dpr, this._dpr);
      this._ctx.lineCap = 'round';
      this._ctx.lineJoin = 'round';
      this._ctx.strokeStyle = this.strokeColor;
      this._ctx.lineWidth = this.strokeWidth;

      this._setupEventListeners();
      this.redraw();
    }
  }

  /**
   * Sets up pointer and touch event listeners on the attached canvas.
   * @private
   */
  _setupEventListeners() {
    if (!this._canvas) return;

    const getPos = (e) => {
      const rect = this._canvas.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        pressure: e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5
      };
    };

    // Pointer events (modern touch, pen, mouse)
    this._canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const pos = getPos(e);
      this.startStroke(pos.x, pos.y, pos.pressure);
    });

    this._canvas.addEventListener('pointermove', (e) => {
      if (!this._isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      this.moveStroke(pos.x, pos.y, pos.pressure);
    });

    const handlePointerEnd = (e) => {
      if (this._isDrawing) {
        e.preventDefault();
        this.endStroke();
      }
    };

    this._canvas.addEventListener('pointerup', handlePointerEnd);
    this._canvas.addEventListener('pointercancel', handlePointerEnd);
    this._canvas.addEventListener('pointerleave', handlePointerEnd);
  }

  /**
   * Starts a new drawing stroke at given coordinates.
   * @param {number} x
   * @param {number} y
   * @param {number} [pressure=0.5]
   */
  startStroke(x, y, pressure = 0.5) {
    this._isDrawing = true;
    this._currentStroke = [{ x, y, pressure, time: Date.now() }];
    this._undoStack = []; // Reset redo on new stroke

    if (this._ctx) {
      this._ctx.beginPath();
      this._ctx.moveTo(x, y);
    }
  }

  /**
   * Appends a coordinate to current drawing stroke and renders Bézier curve.
   * @param {number} x
   * @param {number} y
   * @param {number} [pressure=0.5]
   */
  moveStroke(x, y, pressure = 0.5) {
    if (!this._isDrawing || !this._currentStroke) return;

    const pt = { x, y, pressure, time: Date.now() };
    this._currentStroke.push(pt);

    if (this._ctx && this._currentStroke.length >= 2) {
      const len = this._currentStroke.length;
      const p1 = this._currentStroke[len - 2];
      const p2 = this._currentStroke[len - 1];

      // Quadratic curve smoothing between midpoints
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      this._ctx.strokeStyle = this.strokeColor;
      this._ctx.lineWidth = Math.max(1, this.strokeWidth * (pressure || 0.5) * 1.5);
      this._ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      this._ctx.stroke();
    }
  }

  /**
   * Concludes the current stroke and commits it to stroke history.
   */
  endStroke() {
    if (!this._isDrawing || !this._currentStroke) return;
    this._isDrawing = false;
    if (this._currentStroke.length > 0) {
      this._strokes.push(this._currentStroke);
    }
    this._currentStroke = null;
    this.redraw();
  }

  /**
   * Checks if signature canvas is empty.
   * @returns {boolean}
   */
  isEmpty() {
    return this._strokes.length === 0 && (!this._currentStroke || this._currentStroke.length === 0);
  }

  /**
   * Returns total stroke count.
   * @returns {number}
   */
  getStrokeCount() {
    return this._strokes.length;
  }

  /**
   * Retrieves raw stroke coordinate arrays.
   * @returns {Array<Array<{ x: number, y: number, pressure: number, time: number }>>}
   */
  getStrokes() {
    return JSON.parse(JSON.stringify(this._strokes));
  }

  /**
   * Replaces current strokes with provided array and redraws.
   * @param {Array<Array<{ x: number, y: number, pressure: number, time: number }>>} strokes
   */
  loadStrokes(strokes) {
    if (!Array.isArray(strokes)) return;
    this._strokes = JSON.parse(JSON.stringify(strokes));
    this._undoStack = [];
    this.redraw();
  }

  /**
   * Clears the canvas and all stroke history.
   */
  clear() {
    this._strokes = [];
    this._undoStack = [];
    this._currentStroke = null;
    this._isDrawing = false;
    this.redraw();
  }

  /**
   * Undoes the last stroke.
   */
  undo() {
    if (this._strokes.length > 0) {
      const undone = this._strokes.pop();
      this._undoStack.push(undone);
      this.redraw();
    }
  }

  /**
   * Redoes the last undone stroke.
   */
  redo() {
    if (this._undoStack.length > 0) {
      const redone = this._undoStack.pop();
      this._strokes.push(redone);
      this.redraw();
    }
  }

  /**
   * Repaints all strokes on the 2D canvas context.
   */
  redraw() {
    if (!this._ctx || !this._canvas) return;

    this._ctx.clearRect(0, 0, this.width, this.height);

    if (this.backgroundColor && this.backgroundColor !== 'transparent') {
      this._ctx.fillStyle = this.backgroundColor;
      this._ctx.fillRect(0, 0, this.width, this.height);
    }

    for (const stroke of this._strokes) {
      if (stroke.length === 0) continue;

      this._ctx.beginPath();
      this._ctx.strokeStyle = this.strokeColor;
      this._ctx.lineWidth = this.strokeWidth;
      this._ctx.moveTo(stroke[0].x, stroke[0].y);

      if (stroke.length === 1) {
        this._ctx.arc(stroke[0].x, stroke[0].y, this.strokeWidth / 2, 0, 2 * Math.PI);
        this._ctx.fillStyle = this.strokeColor;
        this._ctx.fill();
        continue;
      }

      for (let i = 1; i < stroke.length; i++) {
        const p1 = stroke[i - 1];
        const p2 = stroke[i];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        this._ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      const last = stroke[stroke.length - 1];
      this._ctx.lineTo(last.x, last.y);
      this._ctx.stroke();
    }
  }

  /**
   * Exports signature to clean, crisp vector SVG string.
   * @param {object} [options]
   * @param {string} [options.strokeColor]
   * @param {number} [options.strokeWidth]
   * @param {string} [options.backgroundColor]
   * @returns {string} SVG XML string
   */
  exportToSvg(options = {}) {
    const color = options.strokeColor || this.strokeColor;
    const width = options.strokeWidth || this.strokeWidth;
    const bg = options.backgroundColor || this.backgroundColor;

    const pathData = [];

    for (const stroke of this._strokes) {
      if (stroke.length === 0) continue;
      if (stroke.length === 1) {
        pathData.push(`M ${stroke[0].x.toFixed(1)} ${stroke[0].y.toFixed(1)} l 0.1 0.1`);
        continue;
      }

      let d = `M ${stroke[0].x.toFixed(1)} ${stroke[0].y.toFixed(1)}`;
      for (let i = 1; i < stroke.length; i++) {
        const p1 = stroke[i - 1];
        const p2 = stroke[i];
        const midX = ((p1.x + p2.x) / 2).toFixed(1);
        const midY = ((p1.y + p2.y) / 2).toFixed(1);
        d += ` Q ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}, ${midX} ${midY}`;
      }
      const last = stroke[stroke.length - 1];
      d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
      pathData.push(d);
    }

    const bgRect =
      bg && bg !== 'transparent'
        ? `<rect width="${this.width}" height="${this.height}" fill="${bg}" />`
        : '';

    const pathsSvg = pathData
      .map(
        (d) =>
          `<path d="${d}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" fill="none" />`
      )
      .join('\n    ');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}" width="${this.width}" height="${this.height}">
  ${bgRect}
  <g>
    ${pathsSvg}
  </g>
</svg>`;
  }

  /**
   * Exports signature to a PNG Data URL or SVG Data URL.
   * @param {'png' | 'svg'} [format='svg']
   * @returns {string} Data URL
   */
  exportToDataUrl(format = 'svg') {
    if (format === 'svg') {
      const svg = this.exportToSvg();
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    if (this._canvas && typeof this._canvas.toDataURL === 'function') {
      return this._canvas.toDataURL('image/png');
    }

    // Fallback SVG data url if canvas not present
    return `data:image/svg+xml;utf8,${encodeURIComponent(this.exportToSvg())}`;
  }

  /**
   * Exports signature to Blob or Uint8Array.
   * @param {'image/png' | 'image/svg+xml'} [mimeType='image/svg+xml']
   * @returns {Promise<Blob | Uint8Array | string>}
   */
  async exportBlob(mimeType = 'image/svg+xml') {
    if (mimeType === 'image/svg+xml') {
      const svg = this.exportToSvg();
      if (typeof Blob !== 'undefined') {
        return new Blob([svg], { type: 'image/svg+xml' });
      }
      return svg;
    }

    if (this._canvas && typeof this._canvas.toBlob === 'function') {
      return new Promise((resolve) => {
        this._canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    }

    // Fallback: return SVG string
    return this.exportToSvg();
  }
}
