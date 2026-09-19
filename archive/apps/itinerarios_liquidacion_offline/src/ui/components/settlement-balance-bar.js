/**
 * Medical Trip Colombia S.A.S. — Settlement Balance Bar & KPI Component
 * Multi-Segment Proportional Settlement Bar, 4 KPI Cards, Category Breakdown Pills, Overdraft Alerts.
 */

import { getArchetype } from '../../infrastructure/index.js';
import { OVERDRAFT_STATUSES } from '../../application/index.js';

export class SettlementBalanceBarComponent {
  /**
   * @param {HTMLElement} container
   * @param {import('../state/app-store.js').AppStore} store
   */
  constructor(container, store) {
    this.container = container;
    this.store = store;
    this._unsubscribe = null;
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
   * Renders the complete settlement balance bar and financial KPIs.
   * @param {object} state
   */
  render(state) {
    const bal = state.settlementBalance;
    const arch = getArchetype(state.activeArchetypeCode);

    if (!bal) {
      this.container.innerHTML = `
        <div class="settlement-card">
          <p style="color: var(--text-muted); text-align: center;">Cargando liquidación financiera...</p>
        </div>
      `;
      return;
    }

    const cur = bal.currency || 'COP';
    const isDebt = bal.balanceStatus === OVERDRAFT_STATUSES.DEBT_OWED_BY_PATIENT || (bal.netBalance && bal.netBalance.isNegative);
    const isRefund = bal.balanceStatus === OVERDRAFT_STATUSES.REFUND_TO_PATIENT;

    const props = bal.categoryProportions || {
      taxiPercent: 0,
      companionPercent: 0,
      pharmacyPercent: 0,
      medicalLabPercent: 0,
      otherPercent: 0
    };

    const kpis = bal.kpis || {
      budgetBurnRatePercent: 0,
      totalTransactionsCount: 0,
      advancesCount: 0,
      expensesCount: 0,
      transfersCount: 0,
      shiftsCount: 0
    };

    const breakdown = bal.breakdown || {};

    // Overdraft Alert Banner HTML
    let overdraftBannerHtml = '';
    if (isDebt) {
      overdraftBannerHtml = `
        <div class="overdraft-banner is-debt">
          <span style="font-size: 1.4rem;">⚠️</span>
          <div class="overdraft-banner-content">
            <h4>Sobregiro: Deuda Pendiente por Cobrar</h4>
            <p>Los gastos de bolsillo superan los anticipos por <strong>${bal.overdraftAmount ? bal.overdraftAmount.formatted : 'monto'}</strong>. Solicitar abono complementario al paciente.</p>
          </div>
        </div>
      `;
    } else if (isRefund) {
      overdraftBannerHtml = `
        <div class="overdraft-banner is-refund">
          <span style="font-size: 1.4rem;">✅</span>
          <div class="overdraft-banner-content">
            <h4>Saldo a Favor: Reembolso al Paciente</h4>
            <p>Anticipos disponibles con remanente neto de <strong>${bal.refundAmount ? bal.refundAmount.formatted : (bal.netBalance ? bal.netBalance.formatted : '')}</strong> para devolución.</p>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="settlement-card">
        
        <!-- Header Section -->
        <div class="settlement-header">
          <div class="patient-info-summary">
            <span class="patient-name-display">
              <span>👤</span> ${arch ? arch.patientName : 'Paciente'}
            </span>
            <span class="patient-meta-display">
              <span>Reserva: <strong>${bal.reservationCode}</strong></span>
              <span>·</span>
              <span>UUID: ${bal.patientUuid}</span>
            </span>
          </div>

          <button id="btn-open-audit-sheet" class="btn btn-outline btn-sm" title="Ver Balance y Auditoría">
            📊 Auditoría Completa
          </button>
        </div>

        <!-- 4 KPI Cards Grid -->
        <div class="kpi-grid">
          
          <div class="kpi-card kpi-advances">
            <div class="kpi-title">
              <span>Anticipos Recibidos</span>
              <span>📥</span>
            </div>
            <div class="kpi-value tabular-nums">${bal.totalAdvances ? bal.totalAdvances.formatted : '$0'}</div>
            <div class="kpi-subtext">${kpis.advancesCount || 1} depósito(s) en ${cur}</div>
          </div>

          <div class="kpi-card kpi-expenses">
            <div class="kpi-title">
              <span>Gastos de Bolsillo</span>
              <span>📤</span>
            </div>
            <div class="kpi-value tabular-nums">${bal.totalExpenses ? bal.totalExpenses.formatted : '$0'}</div>
            <div class="kpi-subtext">${kpis.totalTransactionsCount || 0} movimiento(s) de terreno</div>
          </div>

          <div class="kpi-card kpi-net-balance ${isDebt ? 'is-debt' : ''}">
            <div class="kpi-title">
              <span>${isDebt ? 'Saldo por Cobrar' : 'Balance Neto a Favor'}</span>
              <span>${isDebt ? '🔴' : '🟢'}</span>
            </div>
            <div class="kpi-value tabular-nums">${bal.netBalance ? bal.netBalance.formatted : '$0'}</div>
            <div class="kpi-subtext">${isDebt ? 'Exceso sobre anticipo' : 'Disponible para reembolso'}</div>
          </div>

          <div class="kpi-card kpi-burn">
            <div class="kpi-title">
              <span>Ejecución / Burn Rate</span>
              <span>🔥</span>
            </div>
            <div class="kpi-value tabular-nums">${kpis.budgetBurnRatePercent || 0}%</div>
            <div class="kpi-subtext">del presupuesto total consumido</div>
          </div>

        </div>

        <!-- Multi-Segment Proportional Balance Bar -->
        <div class="balance-bar-section">
          <div class="balance-bar-header">
            <span>Distribución de Gastos por Rubro</span>
            <span class="tabular-nums" style="color: var(--text-muted); font-size: 0.78rem;">
              Total: ${bal.totalExpenses ? bal.totalExpenses.formatted : '$0'}
            </span>
          </div>

          <div class="balance-bar-track" title="Barra proporcional de gastos">
            ${props.taxiPercent > 0 ? `<div class="balance-bar-segment segment-taxi" style="width: ${props.taxiPercent}%;" title="Taxis: ${props.taxiPercent}%">${props.taxiPercent >= 8 ? `${props.taxiPercent}%` : ''}</div>` : ''}
            ${props.companionPercent > 0 ? `<div class="balance-bar-segment segment-companion" style="width: ${props.companionPercent}%;" title="Acompañamiento: ${props.companionPercent}%">${props.companionPercent >= 8 ? `${props.companionPercent}%` : ''}</div>` : ''}
            ${props.pharmacyPercent > 0 ? `<div class="balance-bar-segment segment-pharmacy" style="width: ${props.pharmacyPercent}%;" title="Farmacia: ${props.pharmacyPercent}%">${props.pharmacyPercent >= 8 ? `${props.pharmacyPercent}%` : ''}</div>` : ''}
            ${props.medicalLabPercent > 0 ? `<div class="balance-bar-segment segment-lab" style="width: ${props.medicalLabPercent}%;" title="Laboratorios: ${props.medicalLabPercent}%">${props.medicalLabPercent >= 8 ? `${props.medicalLabPercent}%` : ''}</div>` : ''}
            ${props.otherPercent > 0 ? `<div class="balance-bar-segment segment-other" style="width: ${props.otherPercent}%;" title="Otros: ${props.otherPercent}%">${props.otherPercent >= 8 ? `${props.otherPercent}%` : ''}</div>` : ''}
          </div>
        </div>

        <!-- Category Breakdown Pills -->
        <div class="category-breakdown-grid">
          
          <div class="category-pill">
            <div class="category-pill-header">
              <span class="category-dot" style="background-color: var(--color-rubric-taxi);"></span>
              <span>Taxis / Traslados</span>
            </div>
            <div class="category-pill-value tabular-nums">
              ${breakdown.taxisAndTransfers ? breakdown.taxisAndTransfers.formatted : '$0'}
            </div>
            <div class="category-pill-percent">${props.taxiPercent}%</div>
          </div>

          <div class="category-pill">
            <div class="category-pill-header">
              <span class="category-dot" style="background-color: var(--color-rubric-companion);"></span>
              <span>Guías / Acompañante</span>
            </div>
            <div class="category-pill-value tabular-nums">
              ${breakdown.companionFees ? breakdown.companionFees.formatted : '$0'}
            </div>
            <div class="category-pill-percent">${props.companionPercent}%</div>
          </div>

          <div class="category-pill">
            <div class="category-pill-header">
              <span class="category-dot" style="background-color: var(--color-rubric-pharmacy);"></span>
              <span>Farmacia / Meds</span>
            </div>
            <div class="category-pill-value tabular-nums">
              ${breakdown.pharmacyAndMeds ? breakdown.pharmacyAndMeds.formatted : '$0'}
            </div>
            <div class="category-pill-percent">${props.pharmacyPercent}%</div>
          </div>

          <div class="category-pill">
            <div class="category-pill-header">
              <span class="category-dot" style="background-color: var(--color-rubric-lab);"></span>
              <span>Laboratorios</span>
            </div>
            <div class="category-pill-value tabular-nums">
              ${breakdown.medicalLabs ? breakdown.medicalLabs.formatted : '$0'}
            </div>
            <div class="category-pill-percent">${props.medicalLabPercent}%</div>
          </div>

        </div>

        <!-- Overdraft / Status Banner -->
        ${overdraftBannerHtml}

        <!-- Settlement Quick Actions -->
        <div class="settlement-actions-bar">
          <button id="btn-add-field-expense" class="btn btn-primary" style="flex: 1;">
            ➕ Registrar Gasto de Bolsillo
          </button>
        </div>

      </div>
    `;

    this._bindEvents();
  }

  /**
   * Binds modal triggers.
   * @private
   */
  _bindEvents() {
    const auditBtn = this.container.querySelector('#btn-open-audit-sheet');
    if (auditBtn) {
      auditBtn.addEventListener('click', () => this.store.openModal('AUDIT'));
    }

    const addExpenseBtn = this.container.querySelector('#btn-add-field-expense');
    if (addExpenseBtn) {
      addExpenseBtn.addEventListener('click', () => this.store.openModal('OCR'));
    }
  }
}
