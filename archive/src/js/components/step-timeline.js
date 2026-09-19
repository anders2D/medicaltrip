/**
 * Medical Trip Hub — Step Simulator & Role Filtering Controller
 */

import { appState, notifyStateChange } from '../core/state.js';

export class StepTimelineController {
    static init() {
        // Enlazar clics y navegación por teclado en los entries de pasos (A11y)
        document.querySelectorAll('.step-entry').forEach(entry => {
            if (!entry.hasAttribute('tabindex')) entry.setAttribute('tabindex', '0');
            if (!entry.hasAttribute('role')) entry.setAttribute('role', 'button');
            entry.addEventListener('click', () => {
                this.selectStepEntry(entry);
            });
            entry.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectStepEntry(entry);
                }
            });
        });

        // Enlazar botones de Next / Prev
        document.querySelectorAll('.btn-step-next').forEach(btn => {
            btn.addEventListener('click', () => {
                const container = btn.closest('.flow-card-container');
                if (container) this.stepNext(container.id);
            });
        });

        document.querySelectorAll('.btn-step-prev').forEach(btn => {
            btn.addEventListener('click', () => {
                const container = btn.closest('.flow-card-container');
                if (container) this.stepPrev(container.id);
            });
        });

        // Enlazar chips de roles
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const roleCode = chip.id.replace('chip-', '');
                this.filterByRole(roleCode, chip);
            });
        });
    }

    static selectStepEntry(stepElement) {
        const parent = stepElement.closest('.steps-timeline-card');
        if (!parent) return;
        parent.querySelectorAll('.step-entry').forEach(s => s.classList.remove('active'));
        stepElement.classList.add('active');
    }

    static stepNext(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const steps = Array.from(container.querySelectorAll('.step-entry')).filter(s => s.style.display !== 'none');
        if (steps.length === 0) return;
        const activeIdx = steps.findIndex(s => s.classList.contains('active'));
        if (activeIdx === -1) {
            steps.forEach(s => s.classList.remove('active'));
            steps[0].classList.add('active');
            steps[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else if (activeIdx < steps.length - 1) {
            steps.forEach(s => s.classList.remove('active'));
            steps[activeIdx + 1].classList.add('active');
            steps[activeIdx + 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    static stepPrev(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const steps = Array.from(container.querySelectorAll('.step-entry')).filter(s => s.style.display !== 'none');
        if (steps.length === 0) return;
        const activeIdx = steps.findIndex(s => s.classList.contains('active'));
        if (activeIdx > 0) {
            steps.forEach(s => s.classList.remove('active'));
            steps[activeIdx - 1].classList.add('active');
            steps[activeIdx - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else if (activeIdx === -1) {
            steps.forEach(s => s.classList.remove('active'));
            steps[0].classList.add('active');
            steps[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    static filterByRole(roleCode, chipElement) {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        if (chipElement) {
            chipElement.classList.add('active');
        } else {
            const el = document.getElementById(`chip-${roleCode}`);
            if (el) el.classList.add('active');
        }

        notifyStateChange('activeRole', roleCode);

        document.querySelectorAll('.step-entry').forEach(step => {
            const roles = step.getAttribute('data-role') || '';
            const shouldDisplay = (roleCode === 'ALL' || roles.includes(roleCode));
            step.style.display = shouldDisplay ? 'block' : 'none';
        });

        // Asegurar que cada timeline tenga un paso activo seleccionado entre los visibles
        document.querySelectorAll('.steps-timeline-card').forEach(card => {
            const visibleSteps = Array.from(card.querySelectorAll('.step-entry')).filter(s => s.style.display !== 'none');
            const hasActiveVisible = visibleSteps.some(s => s.classList.contains('active'));
            if (!hasActiveVisible && visibleSteps.length > 0) {
                card.querySelectorAll('.step-entry').forEach(s => s.classList.remove('active'));
                visibleSteps[0].classList.add('active');
            }
        });
    }
}
