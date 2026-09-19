import fs from 'fs';
import path from 'path';

const APP_ROOT = '/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app';
const SRC_DIR = path.join(APP_ROOT, 'src');

function fixImportsInFile(relFile, mapRules) {
  const fullPath = path.join(SRC_DIR, relFile);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const [from, to] of mapRules) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(fullPath, content, 'utf8');
}

// 1. core/infrastructure/crdt/LWWElementSet.ts
fixImportsInFile('core/infrastructure/crdt/LWWElementSet.ts', [
  ["../security/Sha256LedgerChain", "@/features/settlement"],
]);

// 2. core/ui/NationalityBadge.tsx
fixImportsInFile('core/ui/NationalityBadge.tsx', [
  ["../../i18n", "../i18n"],
]);

// 3. features/companion-shifts
fixImportsInFile('features/companion-shifts/presentation/CompanionTurnSheetModal.tsx', [
  ["../../domain/CompanionShift", "../domain/CompanionShift"],
  ["../@/core/domain", "@/core/domain"],
  ["../../hooks/useConfetti", "@/features/settlement"],
  ["../settlement/DigitalSignaturePad", "@/features/settlement"],
]);

// 4. features/directory
fixImportsInFile('features/directory/presentation/PassengersView.tsx', [
  ["../../hooks/useArchetypes", "@/presentation/hooks/useArchetypes"],
]);
fixImportsInFile('features/directory/presentation/UsersView.tsx', [
  ["../../state/AuthContext", "@/core/auth"],
]);

// 5. features/itinerary
fixImportsInFile('features/itinerary/domain/EventStatus.ts', [
  ["../errors/DomainError", "@/core/domain"],
]);

fixImportsInFile('features/itinerary/application/CreateEventUseCase.ts', [
  ["../../domain/ports/IActorEventBusPort", "@/features/swarm"],
  ["../../domain/value-objects/Money", "@/core/domain"],
]);

fixImportsInFile('features/itinerary/application/GenerateSmartItineraryUseCase.ts', [
  ["../../domain/ports/IActorEventBusPort", "@/features/swarm"],
  ["../../domain/entities/PatientBooking", "@/core/domain"],
  ["../../domain/entities/CompanionShift", "@/features/companion-shifts"],
  ["../../domain/entities/DriverTransfer", "@/features/logistics-fleet"],
  ["../../domain/entities/ReceiptExpense", "@/features/settlement"],
  ["../../domain/entities/SettlementLedger", "@/features/settlement"],
  ["../../domain/errors/DomainError", "@/core/domain"],
  ["../../infrastructure/data/providers.data", "@/features/directory"],
  ["../../infrastructure/data/rates.data", "@/core/infrastructure"],
]);

fixImportsInFile('features/itinerary/application/RescheduleEventUseCase.ts', [
  ["../../domain/ports/IActorEventBusPort", "@/features/swarm"],
  ["../../domain/errors/DomainError", "@/core/domain"],
  ["../../domain/value-objects/OperativeTerritory", "@/core/domain"],
  ["../../domain/value-objects/EventStatus", "../domain/EventStatus"],
]);

fixImportsInFile('features/itinerary/application/SignOffItineraryUseCase.ts', [
  ["../../domain/ports/IBlobStoragePort", "@/core/ports"],
]);

fixImportsInFile('features/itinerary/presentation/AgendaView.tsx', [
  ["../../domain/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../common/Button", "@/core/ui/Button"],
  ["../logistics/ArrivalTrackingCard", "@/features/logistics-fleet"],
]);

fixImportsInFile('features/itinerary/presentation/DayView.tsx', [
  ["../../hooks/useSettlement", "@/features/settlement"],
  ["../common/Button", "@/core/ui/Button"],
  ["../../domain/ItineraryEvent", "../domain/ItineraryEvent"],
]);

fixImportsInFile('features/itinerary/presentation/EventCard.tsx', [
  ["../../domain/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../domain/EventCategory", "../domain/EventCategory"],
  ["../../domain/EventStatus", "../domain/EventStatus"],
]);

fixImportsInFile('features/itinerary/presentation/EventDetailDrawer.tsx', [
  ["../../domain/ItineraryEvent", "../domain/ItineraryEvent"],
]);

fixImportsInFile('features/itinerary/presentation/EventForm.tsx', [
  ["../../domain/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../domain/EventCategory", "../domain/EventCategory"],
  ["../../domain/EventStatus", "../domain/EventStatus"],
]);

fixImportsInFile('features/itinerary/presentation/EventHoverCard.tsx', [
  ["../../domain/ItineraryEvent", "../domain/ItineraryEvent"],
]);

fixImportsInFile('features/itinerary/presentation/MonthView.tsx', [
  ["../../hooks/useSettlement", "@/features/settlement"],
  ["../../domain/ItineraryEvent", "../domain/ItineraryEvent"],
]);

fixImportsInFile('features/itinerary/presentation/WeekView.tsx', [
  ["../../domain/ItineraryEvent", "../domain/ItineraryEvent"],
]);

fixImportsInFile('features/itinerary/presentation/hooks/useItinerary.ts', [
  ["../domain/ItineraryEvent", "../../domain/ItineraryEvent"],
  ["../../domain/value-objects/EventStatus", "../../domain/EventStatus"],
  ["../../application/use-cases/CreateEventUseCase", "../../application/CreateEventUseCase"],
]);

// 6. features/logistics-fleet
fixImportsInFile('features/logistics-fleet/presentation/OrientationKitPreview.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../../i18n", "@/core/i18n"],
]);

// 7. features/onboarding
fixImportsInFile('features/onboarding/domain/PatientInvitation.ts', [
  ["../errors/DomainError", "@/core/domain"],
]);

fixImportsInFile('features/onboarding/application/CreatePatientBookingUseCase.ts', [
  ["../../domain/ports/IActorEventBusPort", "@/features/swarm"],
  ["../../domain/entities/SettlementLedger", "@/features/settlement"],
  ["../../domain/errors/DomainError", "@/core/domain"],
  ["../../infrastructure/data/providers.data", "@/features/directory"],
]);

fixImportsInFile('features/onboarding/presentation/NewPatientModal.tsx', [
  ["../@/core/domain", "@/core/domain"],
]);

// 8. features/settlement
fixImportsInFile('features/settlement/application/ExportSettlementPDFUseCase.ts', [
  ["../../domain/errors/DomainError", "@/core/domain"],
]);

fixImportsInFile('features/settlement/application/SettleExpenseUseCase.ts', [
  ["../../domain/ports/IBlobStoragePort", "@/core/ports"],
  ["../../domain/entities/SettlementLedger", "../domain/SettlementLedger"],
]);

fixImportsInFile('features/settlement/infrastructure/JsonPdfExportAdapter.ts', [
  ["../../presentation/i18n", "@/core/i18n"],
]);

fixImportsInFile('features/settlement/presentation/DigitalSignaturePad.tsx', [
  ["../common/Modal", "@/core/ui/Modal"],
  ["../common/Input", "@/core/ui/Input"],
  ["../common/Select", "@/core/ui/Select"],
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../../hooks/useSettlement", "./hooks/useSettlement"],
  ["../language/LanguageSwitcher", "@/core/ui/LanguageSwitcher"],
  ["../../hooks/useConfetti", "./hooks/useConfetti"],
]);

fixImportsInFile('features/settlement/presentation/DockedSettlementBar.tsx', [
  ["../../hooks/useConfetti", "./hooks/useConfetti"],
]);

fixImportsInFile('features/settlement/presentation/ReceiptOcrModal.tsx', [
  ["../common/Badge", "@/core/ui/Badge"],
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../../infrastructure/SimulatedReceiptOCRAdapter", "../infrastructure/SimulatedReceiptOCRAdapter"],
  ["../@/core/domain", "@/core/domain"],
  ["../../domain/ReceiptExpense", "../domain/ReceiptExpense"],
]);

fixImportsInFile('features/settlement/presentation/SettlementKpiCards.tsx', [
  ["../../hooks/useSettlement", "./hooks/useSettlement"],
  ["../common/Badge", "@/core/ui/Badge"],
]);

fixImportsInFile('features/settlement/presentation/hooks/useSettlement.ts', [
  ["../@/core/domain", "@/core/domain"],
  ["../../../domain/SettlementLedger", "../../domain/SettlementLedger"],
]);

// 9. features/swarm
fixImportsInFile('features/swarm/infrastructure/actorPool.ts', [
  ["../infrastructure/crdt/PNCounter", "@/core/infrastructure"],
  ["../infrastructure/crdt/LWWElementSet", "@/core/infrastructure"],
]);

fixImportsInFile('features/swarm/infrastructure/driverActor.worker.ts', [
  ["../domain/ports/IActorEventBusPort", "../domain/IActorEventBusPort"],
]);

fixImportsInFile('features/swarm/infrastructure/financialAuditorActor.worker.ts', [
  ["../domain/ports/IActorEventBusPort", "../domain/IActorEventBusPort"],
  ["../domain/value-objects/Money", "@/core/domain"],
  ["../infrastructure/security/Sha256LedgerChain", "@/features/settlement"],
]);

fixImportsInFile('features/swarm/infrastructure/guideActor.worker.ts', [
  ["../domain/ports/IActorEventBusPort", "../domain/IActorEventBusPort"],
]);

fixImportsInFile('features/swarm/infrastructure/nurseActor.worker.ts', [
  ["../domain/ports/IActorEventBusPort", "../domain/IActorEventBusPort"],
]);

fixImportsInFile('features/swarm/presentation/SwarmDiagnosticsModal.tsx', [
  ["../common/Badge", "@/core/ui/Badge"],
]);

fixImportsInFile('features/swarm/presentation/hooks/useSwarmActors.ts', [
  ["../infrastructure/actorPool", "../../infrastructure/actorPool"],
  ["../../domain/ports/IActorEventBusPort", "../../domain/IActorEventBusPort"],
  ["../../workers/driverActor.worker", "../infrastructure/driverActor.worker"],
  ["../../workers/guideActor.worker", "../infrastructure/guideActor.worker"],
  ["../../workers/nurseActor.worker", "../infrastructure/nurseActor.worker"],
  ["../../workers/financialAuditorActor.worker", "../infrastructure/financialAuditorActor.worker"],
  ["../../infrastructure/security/Sha256LedgerChain", "@/features/settlement"],
]);

console.log('Fixed broken imports.');
