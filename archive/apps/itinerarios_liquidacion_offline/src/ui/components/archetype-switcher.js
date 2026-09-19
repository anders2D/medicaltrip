/**
 * Medical Trip Colombia S.A.S. — Archetype Switcher UI Component
 * 4 Canonical Google Drive Archetypes: RVA171 Catia x5, RVA282 George Cardio, RVA341 Hogenboom CES, RVA077 Rumai Cirugía 12d.
 */

import { ARCHETYPES_DATA, getArchetype, getAllArchetypes } from '../../infrastructure/index.js';

export class ArchetypeSwitcherComponent {
  /**
   * @param {HTMLElement} container
   * @param {import('../state/app-store.js').AppStore} store
   */
  constructor(container, store) {
    this.container = container;
    this.store = store;
    this._unsubscribe = null;

    this.archetypes = [
      {
        code: 'RVA171',
        label: 'RVA171 Catia x5',
        pax: '5 Pax',
        specialty: 'Plástica / Clofán',
        currency: 'COP',
        flag: '🇺🇸'
      },
      {
        code: 'RVA282',
        label: 'RVA282 George Cardio',
        pax: '2 Pax',
        specialty: 'Cardiología / Cardio VID',
        currency: 'USD',
        flag: '🇺🇸'
      },
      {
        code: 'RVA341',
        label: 'RVA341 Hogenboom CES',
        pax: '2 Pax',
        specialty: 'Maxilofacial / CES',
        currency: 'COP',
        flag: '🇳🇱'
      },
      {
        code: 'RVA077',
        label: 'RVA077 Rumai Cirugía 12d',
        pax: '2 Pax',
        specialty: 'Cirugía Compleja 12d / HPTU',
        currency: 'COP',
        flag: '🇵🇦'
      }
    ];
  }

  mount() {
    this._unsubscribe = this.store.subscribe((state) => this.render(state));
  }

  destroy() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  }

  /**
   * Renders the archetype selector pills and patient badge.
   * @param {object} state
   */
  render(state) {
    const activeCode = state.activeArchetypeCode;
    const archData = getArchetype(activeCode);

    this.container.innerHTML = `
      <div class="archetype-switcher-container" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <label for="archetype-select-dropdown" class="sr-only">Seleccionar Arquetipo Operativo:</label>
        <select id="archetype-select-dropdown" class="btn btn-outline btn-sm tabular-nums" style="min-width: 220px; font-weight: 700;">
          ${this.archetypes
            .map(
              (a) => `
              <option value="${a.code}" ${a.code === activeCode ? 'selected' : ''}>
                ${a.flag} ${a.label} (${a.currency})
              </option>
            `
            )
            .join('')}
        </select>
        
        <div class="archetype-pax-badge badge badge-info">
          <span>${archData ? `${archData.durationDays} Días` : 'Multi-Día'}</span>
          <span>·</span>
          <span>${archData ? archData.currency : 'COP'}</span>
        </div>
      </div>
    `;

    const selectEl = this.container.querySelector('#archetype-select-dropdown');
    if (selectEl) {
      selectEl.addEventListener('change', async (e) => {
        const code = e.target.value;
        await this.store.setActiveArchetype(code);
      });
    }
  }
}
