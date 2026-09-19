/**
 * Medical Trip Colombia S.A.S. — Main Application Entrypoint & Bootstrapper
 * Mounts Master-Detail UI Components, Initializes Reactive Store, and Binds Mobile Gestures.
 */

import {
  appStore,
  MedicalTripFieldApp,
  ArchetypeSwitcherComponent,
  ItineraryTimelineComponent,
  SettlementBalanceBarComponent,
  GpsCheckinModalComponent,
  ReceiptOcrModalComponent,
  SignaturePadModalComponent,
  AuditSheetModalComponent
} from './ui/index.js';

export async function bootstrapApp() {
  console.log('[MedicalTrip Field App] Iniciando aplicación offline...');

  // Initialize Store & Multi-Tier Persistence
  await appStore.initialize();

  // Mount UI Components to DOM if in browser environment
  if (typeof document !== 'undefined') {
    const archMount = document.getElementById('archetype-switcher-mount');
    if (archMount) {
      const archComp = new ArchetypeSwitcherComponent(archMount, appStore);
      archComp.mount();
    }

    const itinMount = document.getElementById('itinerary-timeline-mount');
    if (itinMount) {
      const itinComp = new ItineraryTimelineComponent(itinMount, appStore);
      itinComp.mount();
    }

    const setMount = document.getElementById('settlement-balance-mount');
    if (setMount) {
      const setComp = new SettlementBalanceBarComponent(setMount, appStore);
      setComp.mount();
    }

    const gpsMount = document.getElementById('gps-modal-mount');
    if (gpsMount) {
      const gpsComp = new GpsCheckinModalComponent(gpsMount, appStore);
      gpsComp.mount();
    }

    const ocrMount = document.getElementById('ocr-modal-mount');
    if (ocrMount) {
      const ocrComp = new ReceiptOcrModalComponent(ocrMount, appStore);
      ocrComp.mount();
    }

    const sigMount = document.getElementById('signature-modal-mount');
    if (sigMount) {
      const sigComp = new SignaturePadModalComponent(sigMount, appStore);
      sigComp.mount();
    }

    const auditMount = document.getElementById('audit-modal-mount');
    if (auditMount) {
      const auditComp = new AuditSheetModalComponent(auditMount, appStore);
      auditComp.mount();
    }

    // Mobile Drawer Toggle Logic
    const drawerEl = document.getElementById('mobile-settlement-drawer');
    const drawerHandle = document.getElementById('drawer-handle-bar');
    const toggleBtn = document.getElementById('btn-toggle-mobile-drawer');

    if (drawerEl && drawerHandle) {
      const toggleDrawer = () => {
        const isOpen = drawerEl.classList.toggle('is-open');
        if (toggleBtn) {
          toggleBtn.textContent = isOpen ? '▼' : '▲';
        }
      };

      drawerHandle.addEventListener('click', toggleDrawer);
    }
  }

  console.log('[MedicalTrip Field App] Aplicación lista y operativa.');
  return MedicalTripFieldApp;
}

// Auto-run bootstrap on DOMContentLoaded or immediate if already loaded
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootstrapApp());
  } else {
    bootstrapApp();
  }
}
