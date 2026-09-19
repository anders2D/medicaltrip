/**
 * Medical Trip Hub — State Management (Single Source of Truth)
 */

export const appState = {
    activeFlowId: 'flow-macro',
    activeRole: 'ALL',
    theme: 'light',
    fontSize: 'normal',
    highContrast: false,
    dyslexiaFont: false,
    laserActive: false,
    autoPlayInterval: null,
    meetingTimerSeconds: 0,
    viewports: {} // canvasId -> { scale, panX, panY, isDragging, startX, startY }
};

export const listeners = [];

export function subscribe(callback) {
    listeners.push(callback);
}

export function notifyStateChange(key, value) {
    appState[key] = value;
    listeners.forEach(fn => fn(key, value, appState));
}
