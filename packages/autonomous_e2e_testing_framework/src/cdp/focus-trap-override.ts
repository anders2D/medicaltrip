/**
 * Modal Focus-Trap & Fullscreen Override Injector
 * 
 * Injects client-side scripts via CDP (`Page.addScriptToEvaluateOnNewDocument` and `Runtime.evaluate`)
 * to bypass third-party keyboard focus traps, modal locks, and inert overlays in automation runs.
 */

import { CDPDispatcherClient } from './gesture-dispatcher.js';

export const FOCUS_TRAP_OVERRIDE_SCRIPT = `
(function() {
  if (window.__focusTrapOverrideInstalled) return;
  window.__focusTrapOverrideInstalled = true;

  // 1. Bypass Tab key trap event handlers at capture phase
  window.addEventListener(
    'keydown',
    function(event) {
      if (event.key === 'Tab') {
        // Prevent rogue libraries from trapping Tab navigation within modal bounds
        event.stopImmediatePropagation();
      }
    },
    true
  );

  // 2. Safe focus override: prevent focus locking or throwing on hidden/inert nodes
  const originalFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function(options) {
    try {
      return originalFocus.call(this, Object.assign({ preventScroll: false }, options));
    } catch (e) {
      // Ignore focus errors on inert/unmounted elements
    }
  };

  // 3. Neutralize 'inert' attribute and modal backdrops that block synthetic clicks
  function unlockInertElements() {
    const inertElements = document.querySelectorAll('[inert], [aria-modal="true"], dialog[open]');
    inertElements.forEach(function(el) {
      if (el.hasAttribute('inert')) {
        el.removeAttribute('inert');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', unlockInertElements);
  } else {
    unlockInertElements();
  }

  // MutationObserver to continuously neutralize dynamic inert backdrops
  const observer = new MutationObserver(function() {
    unlockInertElements();
  });
  
  if (document.body) {
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['inert'] });
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      if (document.body) {
        observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['inert'] });
      }
    });
  }
})();
`;

export interface FocusTrapOverrideResult {
  scriptIdentifier?: string;
  appliedImmediately: boolean;
}

/**
 * Injects the focus trap bypass script into the active document and all future navigations
 */
export async function injectFocusTrapOverride(
  cdp: CDPDispatcherClient,
  options: { sessionId?: string; persistAcrossNavigations?: boolean } = {}
): Promise<FocusTrapOverrideResult> {
  const sessionId = options.sessionId;
  const persist = options.persistAcrossNavigations ?? true;
  let scriptIdentifier: string | undefined;

  // 1. Persist across navigations via Page domain
  if (persist) {
    try {
      await cdp.send('Page.enable', {}, sessionId);
      const res = await cdp.send<{ identifier: string }>(
        'Page.addScriptToEvaluateOnNewDocument',
        { source: FOCUS_TRAP_OVERRIDE_SCRIPT },
        sessionId
      );
      scriptIdentifier = res.identifier;
    } catch {
      // Page domain might not be supported in some worker targets, fallback to Runtime
    }
  }

  // 2. Evaluate immediately in the current execution context
  let appliedImmediately = false;
  try {
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send(
      'Runtime.evaluate',
      {
        expression: FOCUS_TRAP_OVERRIDE_SCRIPT,
        returnByValue: true
      },
      sessionId
    );
    appliedImmediately = true;
  } catch (err) {
    appliedImmediately = false;
  }

  return {
    scriptIdentifier,
    appliedImmediately
  };
}

/**
 * Removes a previously registered persistent script from Page domain
 */
export async function removeFocusTrapOverride(
  cdp: CDPDispatcherClient,
  scriptIdentifier: string,
  sessionId?: string
): Promise<void> {
  if (!scriptIdentifier) return;
  await cdp.send(
    'Page.removeScriptToEvaluateOnNewDocument',
    { identifier: scriptIdentifier },
    sessionId
  );
}
