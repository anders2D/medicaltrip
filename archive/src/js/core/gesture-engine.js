/**
 * Medical Trip Hub — Gesture, Pan, Zoom & Fullscreen Engine
 * Soporta eventos de ratón, gestos táctiles (Pointer Events), rueda con pinch, zoom HUD y pantalla completa.
 */

import { appState } from './state.js';

export class GestureEngine {
    static init() {
        document.querySelectorAll('.diagram-viewport').forEach(vp => {
            const canvasId = vp.getAttribute('data-canvas-id');
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            appState.viewports[canvasId] = {
                scale: 1.0,
                panX: 0,
                panY: 0,
                isDragging: false,
                startX: 0,
                startY: 0
            };

            const updateTransform = () => {
                const s = appState.viewports[canvasId];
                if (!s) return;
                canvas.style.transform = `translate(${s.panX}px, ${s.panY}px) scale(${s.scale})`;
            };

            // Drag to Pan (Pointer Events)
            vp.addEventListener('pointerdown', (e) => {
                if (e.button !== 0 && e.pointerType === 'mouse') return;
                if (e.target.closest('.diagram-hud-controls') || e.target.closest('.fullscreen-exit-btn')) return;
                const s = appState.viewports[canvasId];
                if (!s) return;
                s.isDragging = true;
                s.startX = e.clientX - s.panX;
                s.startY = e.clientY - s.panY;
                try { vp.setPointerCapture(e.pointerId); } catch(err) {}
                canvas.style.cursor = 'grabbing';
            });

            vp.addEventListener('pointermove', (e) => {
                const s = appState.viewports[canvasId];
                if (!s || !s.isDragging) return;
                s.panX = e.clientX - s.startX;
                s.panY = e.clientY - s.startY;
                updateTransform();
            });

            const endDrag = (e) => {
                const s = appState.viewports[canvasId];
                if (!s) return;
                s.isDragging = false;
                try { vp.releasePointerCapture(e.pointerId); } catch(err) {}
                canvas.style.cursor = 'grab';
            };

            vp.addEventListener('pointerup', endDrag);
            vp.addEventListener('pointercancel', endDrag);

            // Botón de salida de pantalla completa específico del viewport
            const exitBtn = vp.querySelector('.fullscreen-exit-btn');
            if (exitBtn) {
                exitBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.exitFullscreen(vp.id);
                });
            }

            // Wheel / Pinch Zoom
            vp.addEventListener('wheel', (e) => {
                e.preventDefault();
                const s = appState.viewports[canvasId];
                if (!s) return;
                if (e.ctrlKey || e.metaKey) {
                    const zoomDelta = -e.deltaY * 0.01;
                    s.scale = Math.min(Math.max(0.35, s.scale + zoomDelta), 3.5);
                } else {
                    s.panX -= e.deltaX * 0.8;
                    s.panY -= e.deltaY * 0.8;
                }
                updateTransform();
            }, { passive: false });
        });

        // Global keyboard shortcuts (Esc to exit fullscreen)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.fullscreen-active').forEach(el => {
                    this.exitFullscreen(el.id);
                });
            }
        });

        // Sincronizar salida de pantalla completa nativa del navegador
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                document.querySelectorAll('.fullscreen-active').forEach(el => {
                    el.classList.remove('fullscreen-active');
                });
            }
        });
    }

    static zoom(canvasId, factor) {
        if (!appState.viewports[canvasId]) {
            appState.viewports[canvasId] = { scale: 1.0, panX: 0, panY: 0, isDragging: false };
        }
        const s = appState.viewports[canvasId];
        s.scale = Math.min(Math.max(0.35, s.scale * factor), 4.0);
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            canvas.style.transform = `translate(${s.panX}px, ${s.panY}px) scale(${s.scale})`;
        }
    }

    static resetZoom(canvasId) {
        if (!canvasId) return;
        appState.viewports[canvasId] = { scale: 1.0, panX: 0, panY: 0, isDragging: false };
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            canvas.style.transform = `translate(0px, 0px) scale(1.0)`;
        }
    }

    static toggleFullscreen(viewportId) {
        const viewport = document.getElementById(viewportId);
        if (!viewport) return;

        const isCurrentlyFullscreen = viewport.classList.contains('fullscreen-active');
        if (isCurrentlyFullscreen) {
            this.exitFullscreen(viewportId);
        } else {
            document.querySelectorAll('.fullscreen-active').forEach(el => el.classList.remove('fullscreen-active'));
            viewport.classList.add('fullscreen-active');
            
            if (viewport.requestFullscreen && !document.fullscreenElement) {
                viewport.requestFullscreen().catch(() => {});
            }

            const canvasId = viewport.getAttribute('data-canvas-id');
            if (canvasId) this.resetZoom(canvasId);
        }
    }

    static exitFullscreen(viewportId) {
        const viewport = document.getElementById(viewportId);
        if (viewport) viewport.classList.remove('fullscreen-active');
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    }
}
