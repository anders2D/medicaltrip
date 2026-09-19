/**
 * Medical Trip Hub — Mermaid.js Rendering & Theme Coordinator
 */

import { FLOW_DEFINITIONS } from '../data/flows.js';

export class MermaidManager {
    static init(theme = 'light') {
        const isDark = theme === 'dark';
        if (typeof window.mermaid !== 'undefined') {
            window.mermaid.initialize({
                startOnLoad: false,
                theme: isDark ? 'dark' : 'default',
                themeVariables: {
                    darkMode: isDark,
                    background: isDark ? '#131b2e' : '#ffffff',
                    primaryColor: '#0284c7',
                    primaryTextColor: isDark ? '#f8fafc' : '#0f172a',
                    primaryBorderColor: '#0ea5e9',
                    lineColor: '#0284c7',
                    secondaryColor: '#0d9488',
                    tertiaryColor: isDark ? '#0b0f19' : '#f8fafc'
                }
            });
        }
    }

    static async renderDiagram(canvasId) {
        const container = document.getElementById(canvasId);
        if (!container) return false;
        const code = FLOW_DEFINITIONS[canvasId];
        if (!code) return false;

        try {
            if (typeof window.mermaid === 'undefined') {
                console.warn('Mermaid.js library not found on window object.');
                return false;
            }
            const uniqueId = `mermaid-svg-${canvasId}-${Date.now()}`;
            const { svg } = await window.mermaid.render(uniqueId, code);
            container.innerHTML = svg;
            return true;
        } catch (err) {
            console.error(`[MermaidManager] Error rendering diagram for ${canvasId}:`, err);
            container.innerHTML = `<div style="color: #e11d48; padding: 20px;"><i class="fa-solid fa-triangle-exclamation"></i> Error al renderizar: ${err.message}</div>`;
            return false;
        }
    }

    static async renderAll() {
        for (const canvasId of Object.keys(FLOW_DEFINITIONS)) {
            await this.renderDiagram(canvasId);
        }
    }
}
