/**
 * Medical Trip Hub — Navigation & Live Search Controller
 */

import { appState, notifyStateChange } from '../core/state.js';
import { MermaidManager } from '../core/mermaid-manager.js';
import { GestureEngine } from '../core/gesture-engine.js';

export class NavigationController {
    static init() {
        // Enlazar clics en enlaces del sidebar y navegación por teclado (A11y)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                const targetId = link.getAttribute('data-target-flow') || link.id.replace('nav-', '');
                this.navigateFlow(targetId, link);
            });
            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const targetId = link.getAttribute('data-target-flow') || link.id.replace('nav-', '');
                    this.navigateFlow(targetId, link);
                }
            });
        });

        // Búsqueda en vivo
        const searchInput = document.getElementById('liveSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleLiveSearch(e.target.value);
            });
        }
    }

    static navigateFlow(flowId, element) {
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        if (element) {
            element.classList.add('active');
        } else {
            const matchedNav = document.getElementById(`nav-${flowId}`) || document.querySelector(`[data-target-flow="${flowId}"]`);
            if (matchedNav) matchedNav.classList.add('active');
        }

        document.querySelectorAll('.flow-card-container').forEach(panel => panel.classList.remove('active'));
        const target = document.getElementById(flowId);
        if (target) {
            target.classList.add('active');
            notifyStateChange('activeFlowId', flowId);

            const innerCanvas = target.querySelector('.diagram-canvas-inner');
            if (innerCanvas) {
                if (!innerCanvas.querySelector('svg')) {
                    MermaidManager.renderDiagram(innerCanvas.id);
                }
                GestureEngine.resetZoom(innerCanvas.id);
            }
        }
    }

    static handleLiveSearch(term) {
        const q = (term || '').toLowerCase().trim();
        document.querySelectorAll('.nav-link').forEach(link => {
            const matches = link.innerText.toLowerCase().includes(q);
            link.style.display = matches ? 'flex' : 'none';
        });
    }
}
