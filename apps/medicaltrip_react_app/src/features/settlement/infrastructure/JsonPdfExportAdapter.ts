/**
 * Medical Trip Colombia S.A.S. - JsonPdfExportAdapter
 * Formats full financial settlement balance sheets into structured audit JSON and print-ready PDF/HTML statements.
 * Implements IExportPort.
 */

import { IExportPort } from '../domain/IExportPort';
import { PatientBooking } from '@/core/domain';
import { SettlementLedger } from '../domain/SettlementLedger';
import { ItineraryEvent } from '@/features/itinerary';
import { resolveLanguage, TRANSLATIONS, LanguageCode } from '@/core/i18n';

export class JsonPdfExportAdapter implements IExportPort {
  /**
   * Serializes the settlement ledger into a structured audit-ready JSON string.
   */
  public async exportLedgerJson(ledger: SettlementLedger): Promise<string> {
    const totalDebits = ledger.totalExpenses
      .add(ledger.totalGuideFees)
      .add(ledger.totalFleetTaxis);

    const auditPayload = {
      version: '1.0-CQRS',
      company: {
        name: 'Medical Trip Colombia S.A.S.',
        taxId: 'NIT 901.458.789-2',
        legalCorridor: 'Medellín & Oriente Antioqueño, Colombia',
        contact: 'operaciones@medicaltripcolombia.com',
      },
      bookingId: ledger.bookingId,
      settlementType: 'DAILY',
      settlementProtocol: 'Protocolo Exclusivo de Liquidación Diaria',
      date: ledger.date,
      dayNumber: ledger.dayNumber,
      auditTimestamp: new Date().toISOString(),
      lastUpdated: ledger.lastUpdated,
      sha256Seal: ledger.sha256Seal || 'PENDING_FINAL_SEAL',
      totals: {
        totalExpenses: ledger.totalExpenses.toJSON(),
        totalGuideFees: ledger.totalGuideFees.toJSON(),
        totalFleetTaxis: ledger.totalFleetTaxis.toJSON(),
        totalDebits: totalDebits.toJSON(),
        totalAdvances: ledger.totalAdvances.toJSON(),
        netBalance: ledger.netBalance.toJSON(),
      },
      balanceStatus: {
        isSettled: ledger.isSettled(),
        isPatientCredit: ledger.isPatientCredit(),
        isPatientDebt: ledger.isPatientDebt(),
        summaryMessage: ledger.isSettled()
          ? 'Cuenta perfectamente saldada con discrepancia 0.00 COP'
          : ledger.isPatientCredit()
          ? `Saldo a favor del paciente: ${ledger.netBalance.formatCOP()}`
          : `Saldo pendiente por cobrar al paciente: ${ledger.netBalance.formatCOP()}`,
      },
      advances: ledger.advances.map((adv) => ({
        id: adv.id,
        date: adv.date,
        description: adv.description,
        amount: adv.amount.toJSON(),
      })),
    };

    return JSON.stringify(auditPayload, null, 2);
  }

  /**
   * Generates a print-ready PDF/HTML document statement Blob.
   */
  public async exportSettlementPdf(
    booking: PatientBooking,
    ledger: SettlementLedger,
    events: ItineraryEvent[],
    signatureDataUrl?: string,
    lang?: string
  ): Promise<Blob> {
    const htmlContent = this.generateHtmlStatement(booking, ledger, events, signatureDataUrl, lang);
    return new Blob([htmlContent], { type: 'application/pdf' });
  }

  /**
   * Generates the complete HTML markup for the executive settlement statement in the target language.
   */
  public generateHtmlStatement(
    booking: PatientBooking,
    ledger: SettlementLedger,
    events: ItineraryEvent[],
    signatureDataUrl?: string,
    lang?: string
  ): string {
    const resolvedLang: LanguageCode = lang ? resolveLanguage(lang) : 'es';
    const dict = TRANSLATIONS[resolvedLang] || TRANSLATIONS.es;
    const pdf = dict.pdfStatement;

    const totalDebits = ledger.totalExpenses
      .add(ledger.totalGuideFees)
      .add(ledger.totalFleetTaxis);

    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    const statusBadgeText = ledger.isSettled()
      ? pdf.statusSettled
      : ledger.isPatientCredit()
      ? pdf.statusCredit
      : pdf.statusDebt;

    const statusBadgeBg = ledger.isSettled()
      ? '#10b981'
      : ledger.isPatientCredit()
      ? '#0284c7'
      : '#f59e0b';

    return `<!DOCTYPE html>
<html lang="${resolvedLang}">
<head>
  <meta charset="UTF-8" />
  <title>${pdf.documentTitle} - ${booking.code} - ${booking.patientFullName}</title>
  <style>
    @page { size: letter; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .statement-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 11px;
      color: #ffffff;
      background-color: ${statusBadgeBg};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .patient-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .patient-field {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .patient-value {
      font-size: 13px;
      color: #0f172a;
      font-weight: 600;
      margin-top: 2px;
    }
    .table-container {
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px 10px;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
    }
    tr:nth-child(even) td {
      background-color: #fafafa;
    }
    .amount-col {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .balance-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 16px;
    }
    .balance-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 12px;
    }
    .balance-row.total {
      border-top: 2px solid #0f172a;
      border-bottom: none;
      font-size: 14px;
      font-weight: 800;
      padding-top: 10px;
      margin-top: 4px;
    }
    .signature-section {
      margin-top: 36px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      page-break-inside: avoid;
    }
    .signature-box {
      border-top: 1px solid #94a3b8;
      padding-top: 8px;
      text-align: center;
    }
    .signature-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .signature-subtitle {
      font-size: 10px;
      color: #64748b;
    }
    .footer-note {
      margin-top: 30px;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">MEDICAL TRIP COLOMBIA S.A.S.</h1>
      <div class="brand-subtitle">${pdf.companySubtitle1}</div>
      <div class="brand-subtitle">${pdf.companySubtitle2}</div>
      <div class="brand-subtitle" style="font-weight: 700; color: #0f172a; margin-top: 3px;">
        LIQUIDACIÓN DIARIA${ledger.dayNumber ? ` · DÍA ${ledger.dayNumber}` : ''}${ledger.date ? ` (${ledger.date})` : ''}
      </div>
    </div>
    <div style="text-align: right;">
      <span class="statement-badge">${statusBadgeText}</span>
      <div style="font-size: 11px; color: #64748b; margin-top: 6px;">${pdf.bookingCodeLabel} <strong>${booking.code}</strong></div>
      <div style="font-size: 10px; color: #94a3b8;">${pdf.issueDateLabel} ${new Date().toLocaleDateString(resolvedLang === 'en' ? 'en-US' : resolvedLang === 'nl' ? 'nl-NL' : 'es-CO')}</div>
    </div>
  </div>

  <div class="patient-card">
    <div>
      <div class="patient-field">${pdf.patientNameLabel}</div>
      <div class="patient-value">${booking.patientFullName}</div>
    </div>
    <div>
      <div class="patient-field">${pdf.originPaxLabel}</div>
      <div class="patient-value">${booking.country} &bull; ${booking.paxCount} ${booking.paxCount === 1 ? dict.common.person : dict.common.persons}</div>
    </div>
    <div>
      <div class="patient-field">${pdf.hotelAssignedLabel}</div>
      <div class="patient-value">${booking.hotelName || 'No asignado'}</div>
    </div>
    <div>
      <div class="patient-field">${pdf.arrivalDateLabel}</div>
      <div class="patient-value">${booking.arrivalDate.split('T')[0]} (${booking.arrivalAirline || dict.common.flight} ${booking.arrivalFlight || ''})</div>
    </div>
    <div>
      <div class="patient-field">${pdf.departureDateLabel}</div>
      <div class="patient-value">${booking.departureDate.split('T')[0]}</div>
    </div>
    <div>
      <div class="patient-field">${pdf.contactLanguageLabel}</div>
      <div class="patient-value">${booking.phone} &bull; ${booking.language}</div>
    </div>
  </div>

  <div class="table-container">
    <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 8px; color: #0f172a;">${pdf.itineraryTableTitle}</h3>
    <table>
      <thead>
        <tr>
          <th>${pdf.colDayDate}</th>
          <th>${pdf.colSchedule}</th>
          <th>${pdf.colCategory}</th>
          <th>${pdf.colConceptProvider}</th>
          <th>${pdf.colResponsible}</th>
          <th class="amount-col">${pdf.colAmountCop}</th>
        </tr>
      </thead>
      <tbody>
        ${sortedEvents
          .map(
            (e) => `
          <tr>
            <td><strong>${dict.common.day} ${e.dayNumber}</strong> (${e.startDateTime.split('T')[0]})</td>
            <td>${e.startDateTime.substring(11, 16)} - ${e.endDateTime.substring(11, 16)}</td>
            <td><span style="font-weight: 600; font-size: 10px; text-transform: uppercase;">${e.category}</span></td>
            <td>
              <strong>${e.title}</strong><br/>
              <span style="font-size: 11px; color: #64748b;">${e.location.address}</span>
            </td>
            <td>${e.assignedGuideId ? pdf.roleGuide : e.assignedDriverId ? pdf.roleFleet : pdf.roleClinical}</td>
            <td class="amount-col">${e.cost.isZero() ? dict.common.included : e.cost.formatCOP()}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <div class="kpi-grid">
    <div class="balance-box">
      <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #475569;">${pdf.costBreakdownTitle}</h4>
      <div class="balance-row">
        <span>${pdf.fleetTransfersLabel}</span>
        <span class="amount-col">${ledger.totalFleetTaxis.formatCOP()}</span>
      </div>
      <div class="balance-row">
        <span>${pdf.guideFeesLabel}</span>
        <span class="amount-col">${ledger.totalGuideFees.formatCOP()}</span>
      </div>
      <div class="balance-row">
        <span>${pdf.expensesLabel}</span>
        <span class="amount-col">${ledger.totalExpenses.formatCOP()}</span>
      </div>
      <div class="balance-row" style="font-weight: 700;">
        <span>${pdf.subtotalDebitsLabel}</span>
        <span class="amount-col">${totalDebits.formatCOP()}</span>
      </div>
    </div>

    <div class="balance-box">
      <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #475569;">${pdf.balanceTitle}</h4>
      <div class="balance-row">
        <span>${pdf.totalDebitsLabel}</span>
        <span class="amount-col">${totalDebits.formatCOP()}</span>
      </div>
      <div class="balance-row">
        <span>${pdf.advancesReceivedLabel}</span>
        <span class="amount-col" style="color: #059669;">- ${ledger.totalAdvances.formatCOP()}</span>
      </div>
      <div class="balance-row total">
        <span>${pdf.netBalanceLabel}</span>
        <span class="amount-col" style="color: ${ledger.isSettled() ? '#10b981' : ledger.isPatientCredit() ? '#0284c7' : '#dc2626'};">
          ${ledger.netBalance.formatCOP()}
        </span>
      </div>
    </div>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div style="height: 50px; display: flex; align-items: center; justify-content: center;">
        ${
          signatureDataUrl
            ? `<img src="${signatureDataUrl}" alt="Firma Digital Paciente" data-testid="pdf-embedded-signature" style="max-height: 48px; max-width: 180px; object-fit: contain;" />`
            : '<div style="height: 50px;"></div>'
        }
      </div>
      <div class="signature-title">${booking.patientFullName}</div>
      <div class="signature-subtitle">${pdf.patientSignatureTitle}</div>
    </div>
    <div class="signature-box">
      <div style="height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="font-family: monospace; font-size: 8.5px; color: #475569; word-break: break-all; max-width: 220px; line-height: 1.2;">
          ${ledger.sha256Seal ? `${pdf.validationCodeLabel} ${ledger.sha256Seal}` : pdf.verifiedLabel}
        </div>
      </div>
      <div class="signature-title">${pdf.auditCoordinationTitle}</div>
      <div class="signature-subtitle">${pdf.auditCoordinationSubtitle}</div>
    </div>
  </div>

  <div class="footer-note">
    ${pdf.footerNote}
  </div>
</body>
</html>`;
  }
}

