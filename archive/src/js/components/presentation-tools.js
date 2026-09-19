/**
 * Medical Trip Hub — Presentation Tools (Laser Pointer, Meeting Stopwatch & Auto-Play)
 */

import { appState, notifyStateChange } from '../core/state.js';

export class PresentationTools {
    static init() {
        // Laser Pointer
        const laserBtn = document.getElementById('btnLaser');
        const laserDot = document.getElementById('laserPointer');

        if (laserBtn && laserDot) {
            laserBtn.addEventListener('click', () => {
                appState.laserActive = !appState.laserActive;
                laserDot.style.display = appState.laserActive ? 'block' : 'none';
                laserBtn.classList.toggle('active', appState.laserActive);
            });

            window.addEventListener('mousemove', (e) => {
                if (appState.laserActive) {
                    laserDot.style.left = `${e.clientX}px`;
                    laserDot.style.top = `${e.clientY}px`;
                }
            });
        }

        // Meeting Timer (Stopwatch)
        const timerDigits = document.getElementById('timerDigits');
        if (timerDigits) {
            setInterval(() => {
                appState.meetingTimerSeconds++;
                const mins = String(Math.floor(appState.meetingTimerSeconds / 60)).padStart(2, '0');
                const secs = String(appState.meetingTimerSeconds % 60).padStart(2, '0');
                timerDigits.innerText = `${mins}:${secs}`;
            }, 1000);
        }

        // Auto-Play Slides (Presenter Mode)
        const autoPlayBtn = document.getElementById('btnAutoPlay');
        if (autoPlayBtn) {
            autoPlayBtn.addEventListener('click', () => {
                this.toggleAutoPlay(autoPlayBtn);
            });
        }
    }

    static toggleAutoPlay(btn) {
        if (appState.autoPlayInterval) {
            clearInterval(appState.autoPlayInterval);
            appState.autoPlayInterval = null;
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-solid fa-film" style="color: #7c3aed;"></i> Presentar';
        } else {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar';
            const links = Array.from(document.querySelectorAll('.nav-link'));
            let currentIdx = links.findIndex(l => l.classList.contains('active'));
            appState.autoPlayInterval = setInterval(() => {
                currentIdx = (currentIdx + 1) % links.length;
                links[currentIdx].click();
            }, 8000);
        }
    }
}
