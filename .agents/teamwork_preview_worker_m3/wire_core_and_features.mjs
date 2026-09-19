import fs from 'fs';
import path from 'path';

const APP_ROOT = '/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app';
const SRC_DIR = path.join(APP_ROOT, 'src');

function replaceInFile(relPath, replacements) {
  const fullPath = path.join(SRC_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${relPath}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const [from, to] of replacements) {
    content = content.replaceAll(from, to);
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated: ${relPath}`);
}

// ----------------------------------------------------
// 1. CORE / INFRASTRUCTURE
// ----------------------------------------------------
replaceInFile('core/infrastructure/storage/DexieStorageAdapter.ts', [
  ["../../domain/ports/IStoragePort", "../../../core/ports/IStoragePort"],
  ["../../domain/ports/IBlobStoragePort", "../../../core/ports/IBlobStoragePort"],
  ["../../domain/entities/PatientBooking", "../../../core/domain/entities/PatientBooking"],
  ["../../domain/entities/ItineraryEvent", "@/features/itinerary"],
  ["../../domain/entities/CompanionShift", "@/features/companion-shifts"],
  ["../../domain/entities/DriverTransfer", "@/features/logistics-fleet"],
  ["../../domain/entities/ReceiptExpense", "@/features/settlement"],
  ["../../domain/entities/SettlementLedger", "@/features/settlement"],
  ["../../domain/value-objects/Money", "../../../core/domain/value-objects/Money"],
  ["../../domain/value-objects/OperativeTerritory", "../../../core/domain/value-objects/OperativeTerritory"],
  ["../../domain/value-objects/EventCategory", "@/features/itinerary"],
  ["../../domain/value-objects/EventStatus", "@/features/itinerary"],
]);

replaceInFile('core/infrastructure/storage/InMemoryStorageAdapter.ts', [
  ["../../domain/ports/IStoragePort", "../../../core/ports/IStoragePort"],
  ["../../domain/ports/IBlobStoragePort", "../../../core/ports/IBlobStoragePort"],
  ["../../domain/entities/PatientBooking", "../../../core/domain/entities/PatientBooking"],
  ["../../domain/entities/ItineraryEvent", "@/features/itinerary"],
  ["../../domain/entities/CompanionShift", "@/features/companion-shifts"],
  ["../../domain/entities/DriverTransfer", "@/features/logistics-fleet"],
  ["../../domain/entities/ReceiptExpense", "@/features/settlement"],
  ["../../domain/entities/SettlementLedger", "@/features/settlement"],
  ["../../domain/value-objects/Money", "../../../core/domain/value-objects/Money"],
  ["../../domain/value-objects/OperativeTerritory", "../../../core/domain/value-objects/OperativeTerritory"],
]);

replaceInFile('core/infrastructure/storage/SupabaseStorageAdapter.ts', [
  ["../../domain/ports/IStoragePort", "../../../core/ports/IStoragePort"],
  ["../../domain/ports/IBlobStoragePort", "../../../core/ports/IBlobStoragePort"],
  ["../../domain/entities/PatientBooking", "../../../core/domain/entities/PatientBooking"],
  ["../../domain/entities/ItineraryEvent", "@/features/itinerary"],
  ["../../domain/entities/CompanionShift", "@/features/companion-shifts"],
  ["../../domain/entities/DriverTransfer", "@/features/logistics-fleet"],
  ["../../domain/entities/ReceiptExpense", "@/features/settlement"],
  ["../../domain/entities/SettlementLedger", "@/features/settlement"],
  ["../../domain/value-objects/Money", "../../../core/domain/value-objects/Money"],
  ["../../domain/value-objects/OperativeTerritory", "../../../core/domain/value-objects/OperativeTerritory"],
]);

replaceInFile('core/infrastructure/storage/WebKitPersistAdapter.ts', [
  ["../../domain/ports/IStoragePersistPort", "../../../core/ports/IStoragePersistPort"],
]);

replaceInFile('core/infrastructure/storage/LocalStorageEventStreamAdapter.ts', [
  ["../../domain/ports/IStoragePort", "../../../core/ports/IStoragePort"],
]);

replaceInFile('core/infrastructure/data/archetypes.data.ts', [
  ["../../domain/entities/PatientBooking", "../../../core/domain/entities/PatientBooking"],
  ["../../domain/entities/ItineraryEvent", "@/features/itinerary"],
  ["../../domain/entities/CompanionShift", "@/features/companion-shifts"],
  ["../../domain/entities/DriverTransfer", "@/features/logistics-fleet"],
  ["../../domain/entities/ReceiptExpense", "@/features/settlement"],
  ["../../domain/entities/SettlementLedger", "@/features/settlement"],
  ["../../domain/value-objects/OperativeTerritory", "../../../core/domain/value-objects/OperativeTerritory"],
  ["../../domain/value-objects/Money", "../../../core/domain/value-objects/Money"],
]);

replaceInFile('core/infrastructure/data/rates.data.ts', [
  ["../../domain/value-objects/Money", "../../../core/domain/value-objects/Money"],
]);

// ----------------------------------------------------
// 2. CORE / AUTH & UI
// ----------------------------------------------------
replaceInFile('core/auth/LoginView.tsx', [
  ["../../state/AuthContext", "./AuthContext"],
]);

replaceInFile('core/ui/LanguageBadge.tsx', [
  ["../../i18n", "../i18n"],
]);

replaceInFile('core/ui/LanguageSwitcher.tsx', [
  ["../../i18n", "../i18n"],
]);

// ----------------------------------------------------
// 3. FEATURES / SETTLEMENT
// ----------------------------------------------------
replaceInFile('features/settlement/domain/SettlementLedger.ts', [
  ["../value-objects/Money", "@/core/domain"],
  ["./CompanionShift", "@/features/companion-shifts"],
  ["./DriverTransfer", "@/features/logistics-fleet"],
]);

replaceInFile('features/settlement/domain/ReceiptExpense.ts', [
  ["../value-objects/Money", "@/core/domain"],
]);

replaceInFile('features/settlement/domain/IExportPort.ts', [
  ["../entities/PatientBooking", "@/core/domain"],
  ["../entities/SettlementLedger", "./SettlementLedger"],
  ["../entities/ItineraryEvent", "@/features/itinerary"],
]);

replaceInFile('features/settlement/domain/IOCRPort.ts', [
  ["../value-objects/Money", "@/core/domain"],
]);

replaceInFile('features/settlement/application/OneTapSettlementWorkflowUseCase.ts', [
  ["../../domain/ports/IStoragePort", "@/core/ports"],
  ["../../domain/ports/IBlobStoragePort", "@/core/ports"],
  ["../../domain/ports/IExportPort", "../domain/IExportPort"],
  ["../../domain/entities/PatientBooking", "@/core/domain"],
  ["../../domain/entities/SettlementLedger", "../domain/SettlementLedger"],
  ["../../domain/entities/ReceiptExpense", "../domain/ReceiptExpense"],
  ["../../domain/entities/CompanionShift", "@/features/companion-shifts"],
  ["../../domain/entities/DriverTransfer", "@/features/logistics-fleet"],
  ["../../domain/entities/ItineraryEvent", "@/features/itinerary"],
  ["../../domain/errors/DomainError", "@/core/domain"],
  ["../../infrastructure/security/Sha256LedgerChain", "../infrastructure/Sha256LedgerChain"],
  ["../../infrastructure/ServiceContainer", "@/core/infrastructure"],
]);

replaceInFile('features/settlement/application/ExportSettlementPDFUseCase.ts', [
  ["../../domain/ports/IStoragePort", "@/core/ports"],
  ["../../domain/ports/IBlobStoragePort", "@/core/ports"],
  ["../../domain/ports/IExportPort", "../domain/IExportPort"],
  ["../../domain/entities/PatientBooking", "@/core/domain"],
  ["../../domain/entities/SettlementLedger", "../domain/SettlementLedger"],
  ["../../domain/entities/ItineraryEvent", "@/features/itinerary"],
]);

replaceInFile('features/settlement/application/ReconcileSettlementUseCase.ts', [
  ["../../domain/ports/IStoragePort", "@/core/ports"],
  ["../../domain/entities/SettlementLedger", "../domain/SettlementLedger"],
  ["../../domain/entities/ReceiptExpense", "../domain/ReceiptExpense"],
  ["../../domain/entities/CompanionShift", "@/features/companion-shifts"],
  ["../../domain/entities/DriverTransfer", "@/features/logistics-fleet"],
]);

replaceInFile('features/settlement/application/SettleExpenseUseCase.ts', [
  ["../../domain/ports/IStoragePort", "@/core/ports"],
  ["../../domain/entities/ReceiptExpense", "../domain/ReceiptExpense"],
  ["../../domain/value-objects/Money", "@/core/domain"],
]);

replaceInFile('features/settlement/infrastructure/JsonPdfExportAdapter.ts', [
  ["../../domain/ports/IExportPort", "../domain/IExportPort"],
  ["../../domain/entities/SettlementLedger", "../domain/SettlementLedger"],
  ["../../domain/entities/PatientBooking", "@/core/domain"],
  ["../../domain/entities/ItineraryEvent", "@/features/itinerary"],
  ["../../domain/entities/ReceiptExpense", "../domain/ReceiptExpense"],
  ["../../domain/entities/CompanionShift", "@/features/companion-shifts"],
  ["../../domain/entities/DriverTransfer", "@/features/logistics-fleet"],
  ["../../domain/value-objects/Money", "@/core/domain"],
  ["../../domain/value-objects/OperativeTerritory", "@/core/domain"],
]);

replaceInFile('features/settlement/infrastructure/SimulatedReceiptOCRAdapter.ts', [
  ["../../domain/ports/IOCRPort", "../domain/IOCRPort"],
  ["../../domain/entities/ReceiptExpense", "../domain/ReceiptExpense"],
  ["../../domain/value-objects/Money", "@/core/domain"],
]);

replaceInFile('features/settlement/infrastructure/Sha256LedgerChain.ts', [
  ["../../domain/value-objects/Money", "@/core/domain"],
]);

replaceInFile('features/settlement/presentation/DockedSettlementBar.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Button", "@/core/ui/Button"],
  ["../common/Badge", "@/core/ui/Badge"],
  ["../../domain/entities/ReceiptExpense", "../domain/ReceiptExpense"],
  ["../../domain/entities/SettlementLedger", "../domain/SettlementLedger"],
  ["../../hooks/useSettlement", "./hooks/useSettlement"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/settlement/presentation/ReceiptOcrModal.tsx', [
  ["../../domain/entities/ReceiptExpense", "../domain/ReceiptExpense"],
  ["../../domain/value-objects/Money", "@/core/domain"],
  ["../../infrastructure/ocr/SimulatedReceiptOCRAdapter", "../infrastructure/SimulatedReceiptOCRAdapter"],
  ["../common/Button", "@/core/ui/Button"],
  ["../common/Modal", "@/core/ui/Modal"],
  ["../common/Input", "@/core/ui/Input"],
  ["../common/Select", "@/core/ui/Select"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/settlement/presentation/DigitalSignaturePad.tsx', [
  ["../common/Button", "@/core/ui/Button"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/settlement/presentation/SettlementKpiCards.tsx', [
  ["../../domain/entities/SettlementLedger", "../domain/SettlementLedger"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/settlement/presentation/SettlementView.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../settlement/DockedSettlementBar", "./DockedSettlementBar"],
  ["../settlement/ReceiptOcrModal", "./ReceiptOcrModal"],
  ["../settlement/DigitalSignaturePad", "./DigitalSignaturePad"],
  ["../settlement/SettlementKpiCards", "./SettlementKpiCards"],
  ["../common/Button", "@/core/ui/Button"],
  ["../common/Badge", "@/core/ui/Badge"],
  ["../../domain/entities/ReceiptExpense", "../domain/ReceiptExpense"],
  ["../../domain/entities/SettlementLedger", "../domain/SettlementLedger"],
  ["../../hooks/useSettlement", "./hooks/useSettlement"],
  ["../../hooks/useConfetti", "./hooks/useConfetti"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/settlement/presentation/hooks/useSettlement.ts', [
  ["../state/AppContext", "@/presentation/state/AppContext"],
  ["../domain/entities/SettlementLedger", "../../domain/SettlementLedger"],
  ["../domain/entities/ReceiptExpense", "../../domain/ReceiptExpense"],
  ["../domain/value-objects/Money", "@/core/domain"],
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../../domain/entities/SettlementLedger", "../../domain/SettlementLedger"],
  ["../../domain/entities/ReceiptExpense", "../../domain/ReceiptExpense"],
  ["../../domain/value-objects/Money", "@/core/domain"],
]);

// ----------------------------------------------------
// 4. FEATURES / ITINERARY
// ----------------------------------------------------
replaceInFile('features/itinerary/domain/ItineraryEvent.ts', [
  ["../value-objects/OperativeTerritory", "@/core/domain"],
  ["../value-objects/Money", "@/core/domain"],
]);

replaceInFile('features/itinerary/application/CreateEventUseCase.ts', [
  ["../../domain/ports/IStoragePort", "@/core/ports"],
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../domain/value-objects/EventCategory", "../domain/EventCategory"],
  ["../../domain/value-objects/EventStatus", "../domain/EventStatus"],
  ["../../domain/value-objects/OperativeTerritory", "@/core/domain"],
]);

replaceInFile('features/itinerary/application/GenerateSmartItineraryUseCase.ts', [
  ["../../domain/ports/IStoragePort", "@/core/ports"],
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../domain/value-objects/EventCategory", "../domain/EventCategory"],
  ["../../domain/value-objects/EventStatus", "../domain/EventStatus"],
  ["../../domain/value-objects/OperativeTerritory", "@/core/domain"],
  ["../../domain/value-objects/Money", "@/core/domain"],
]);

replaceInFile('features/itinerary/application/RescheduleEventUseCase.ts', [
  ["../../domain/ports/IStoragePort", "@/core/ports"],
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
]);

replaceInFile('features/itinerary/application/SignOffItineraryUseCase.ts', [
  ["../../domain/ports/IStoragePort", "@/core/ports"],
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
]);

replaceInFile('features/itinerary/presentation/CalendarContainer.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["./MonthView", "./MonthView"],
  ["./WeekView", "./WeekView"],
  ["./DayView", "./DayView"],
  ["./AgendaView", "./AgendaView"],
  ["./CalendarHeader", "./CalendarHeader"],
  ["../drawer/EventDetailDrawer", "./EventDetailDrawer"],
  ["../modals/SmartItineraryModal", "./SmartItineraryModal"],
  ["../timezone/DualTimezoneChip", "./DualTimezoneChip"],
  ["../../hooks/useItinerary", "./hooks/useItinerary"],
  ["../common/Button", "@/core/ui/Button"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/itinerary/presentation/CalendarHeader.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Button", "@/core/ui/Button"],
  ["../../i18n", "@/core/i18n"],
  ["../timezone/DualTimezoneChip", "./DualTimezoneChip"],
  ["../language/LanguageSwitcher", "@/core/ui/LanguageSwitcher"],
]);

replaceInFile('features/itinerary/presentation/MonthView.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["./EventCard", "./EventCard"],
  ["./EventHoverCard", "./EventHoverCard"],
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/itinerary/presentation/WeekView.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["./EventCard", "./EventCard"],
  ["./EventHoverCard", "./EventHoverCard"],
  ["./GhostDropIndicator", "./GhostDropIndicator"],
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/itinerary/presentation/DayView.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["./EventCard", "./EventCard"],
  ["./EventHoverCard", "./EventHoverCard"],
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/itinerary/presentation/AgendaView.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["./EventCard", "./EventCard"],
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/itinerary/presentation/EventCard.tsx', [
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../domain/value-objects/EventCategory", "../domain/EventCategory"],
  ["../../domain/value-objects/EventStatus", "../domain/EventStatus"],
  ["../common/Badge", "@/core/ui/Badge"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/itinerary/presentation/EventHoverCard.tsx', [
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/itinerary/presentation/EventDetailDrawer.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["./EventForm", "./EventForm"],
  ["../common/Button", "@/core/ui/Button"],
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/itinerary/presentation/EventForm.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Button", "@/core/ui/Button"],
  ["../common/Input", "@/core/ui/Input"],
  ["../common/Select", "@/core/ui/Select"],
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../../domain/value-objects/EventCategory", "../domain/EventCategory"],
  ["../../domain/value-objects/EventStatus", "../domain/EventStatus"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/itinerary/presentation/SmartItineraryModal.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Button", "@/core/ui/Button"],
  ["../common/Modal", "@/core/ui/Modal"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/itinerary/presentation/hooks/useItinerary.ts', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../state/AppContext", "@/presentation/state/AppContext"],
  ["../../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
  ["../domain/entities/ItineraryEvent", "../domain/ItineraryEvent"],
]);

// ----------------------------------------------------
// 5. FEATURES / LOGISTICS-FLEET
// ----------------------------------------------------
replaceInFile('features/logistics-fleet/domain/DriverTransfer.ts', [
  ["../value-objects/OperativeTerritory", "@/core/domain"],
  ["../value-objects/Money", "@/core/domain"],
]);

replaceInFile('features/logistics-fleet/application/PerformDriverCheckInUseCase.ts', [
  ["../../domain/ports/IStoragePort", "@/core/ports"],
  ["../../domain/ports/IActorEventBusPort", "@/features/swarm"],
  ["../../domain/entities/DriverTransfer", "../domain/DriverTransfer"],
  ["../../domain/entities/ItineraryEvent", "@/features/itinerary"],
  ["../../domain/value-objects/EventStatus", "@/features/itinerary"],
  ["../../domain/value-objects/OperativeTerritory", "@/core/domain"],
  ["../../domain/value-objects/Money", "@/core/domain"],
]);

replaceInFile('features/logistics-fleet/presentation/ArrivalTrackingCard.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["./DriverCheckInAction", "./DriverCheckInAction"],
  ["./OrientationKitPreview", "./OrientationKitPreview"],
  ["../badges/LanguageBadge", "@/core/ui/LanguageBadge"],
  ["../badges/NationalityBadge", "@/core/ui/NationalityBadge"],
  ["../common/Badge", "@/core/ui/Badge"],
  ["../common/Button", "@/core/ui/Button"],
  ["../../domain/entities/DriverTransfer", "../domain/DriverTransfer"],
  ["../../domain/entities/ItineraryEvent", "@/features/itinerary"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/logistics-fleet/presentation/DriverCheckInAction.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Button", "@/core/ui/Button"],
  ["../common/Badge", "@/core/ui/Badge"],
  ["../../domain/entities/DriverTransfer", "../domain/DriverTransfer"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/logistics-fleet/presentation/WelcomeOrientationModal.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Button", "@/core/ui/Button"],
  ["../common/Modal", "@/core/ui/Modal"],
  ["../../i18n", "@/core/i18n"],
]);

// ----------------------------------------------------
// 6. FEATURES / COMPANION-SHIFTS
// ----------------------------------------------------
replaceInFile('features/companion-shifts/domain/CompanionShift.ts', [
  ["../value-objects/Money", "@/core/domain"],
]);

replaceInFile('features/companion-shifts/presentation/CompanionTurnSheetModal.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Button", "@/core/ui/Button"],
  ["../common/Modal", "@/core/ui/Modal"],
  ["../settlement/DigitalSignaturePad", "@/features/settlement"],
  ["./MealSubsidySelector", "./MealSubsidySelector"],
  ["../../domain/entities/CompanionShift", "../domain/CompanionShift"],
  ["../../domain/value-objects/Money", "@/core/domain"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/companion-shifts/presentation/MealSubsidySelector.tsx', [
  ["../../domain/value-objects/Money", "@/core/domain"],
  ["../../i18n", "@/core/i18n"],
]);

// ----------------------------------------------------
// 7. FEATURES / ONBOARDING
// ----------------------------------------------------
replaceInFile('features/onboarding/domain/IPatientInvitationRepository.ts', [
  ["../entities/PatientInvitation", "./PatientInvitation"],
]);

replaceInFile('features/onboarding/application/CreatePatientInvitationUseCase.ts', [
  ["../../domain/ports/IPatientInvitationRepository", "../domain/IPatientInvitationRepository"],
  ["../../domain/entities/PatientInvitation", "../domain/PatientInvitation"],
]);

replaceInFile('features/onboarding/application/GetPatientInvitationUseCase.ts', [
  ["../../domain/ports/IPatientInvitationRepository", "../domain/IPatientInvitationRepository"],
  ["../../domain/entities/PatientInvitation", "../domain/PatientInvitation"],
]);

replaceInFile('features/onboarding/application/CreatePatientBookingUseCase.ts', [
  ["../../domain/ports/IStoragePort", "@/core/ports"],
  ["../../domain/entities/PatientBooking", "@/core/domain"],
  ["../../domain/value-objects/OperativeTerritory", "@/core/domain"],
]);

replaceInFile('features/onboarding/infrastructure/LocalStoragePatientInvitationAdapter.ts', [
  ["../../domain/ports/IPatientInvitationRepository", "../domain/IPatientInvitationRepository"],
  ["../../domain/entities/PatientInvitation", "../domain/PatientInvitation"],
]);

replaceInFile('features/onboarding/infrastructure/SupabasePatientInvitationAdapter.ts', [
  ["../../domain/ports/IPatientInvitationRepository", "../domain/IPatientInvitationRepository"],
  ["../../domain/entities/PatientInvitation", "../domain/PatientInvitation"],
]);

replaceInFile('features/onboarding/presentation/PatientSelfRegistrationView.tsx', [
  ["../../../domain/entities/PatientBooking", "@/core/domain"],
  ["../../../domain/value-objects/OperativeTerritory", "@/core/domain"],
  ["../../../domain/errors/DomainError", "@/core/domain"],
  ["../../../application/use-cases/CreatePatientBookingUseCase", "../application/CreatePatientBookingUseCase"],
  ["../../../application/use-cases/GetPatientInvitationUseCase", "../application/GetPatientInvitationUseCase"],
  ["../../../infrastructure/storage/DexieStorageAdapter", "@/core/infrastructure"],
  ["../../../infrastructure/ServiceContainer", "@/core/infrastructure"],
  ["../../i18n", "@/core/i18n"],
  ["../../components/common/Button", "@/core/ui/Button"],
  ["../../components/common/Input", "@/core/ui/Input"],
  ["../../components/common/Select", "@/core/ui/Select"],
  ["../../components/common/Badge", "@/core/ui/Badge"],
  ["../common/Button", "@/core/ui/Button"],
  ["../common/Input", "@/core/ui/Input"],
  ["../common/Select", "@/core/ui/Select"],
  ["../common/Badge", "@/core/ui/Badge"],
]);

replaceInFile('features/onboarding/presentation/SendPatientInvitationModal.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Button", "@/core/ui/Button"],
  ["../common/Modal", "@/core/ui/Modal"],
  ["../common/Input", "@/core/ui/Input"],
  ["../common/Select", "@/core/ui/Select"],
  ["../../i18n", "@/core/i18n"],
  ["../../domain/value-objects/OperativeTerritory", "@/core/domain"],
]);

replaceInFile('features/onboarding/presentation/NewPatientModal.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Button", "@/core/ui/Button"],
  ["../common/Modal", "@/core/ui/Modal"],
  ["../common/Input", "@/core/ui/Input"],
  ["../common/Select", "@/core/ui/Select"],
  ["../../i18n", "@/core/i18n"],
  ["../../domain/entities/PatientBooking", "@/core/domain"],
  ["../../domain/value-objects/OperativeTerritory", "@/core/domain"],
]);

// ----------------------------------------------------
// 8. FEATURES / DIRECTORY
// ----------------------------------------------------
replaceInFile('features/directory/infrastructure/providers.data.ts', [
  ["../../domain/value-objects/OperativeTerritory", "@/core/domain"],
]);

replaceInFile('features/directory/presentation/UsersView.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Badge", "@/core/ui/Badge"],
  ["../common/Button", "@/core/ui/Button"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/directory/presentation/PassengersView.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Badge", "@/core/ui/Badge"],
  ["../badges/LanguageBadge", "@/core/ui/LanguageBadge"],
  ["../badges/NationalityBadge", "@/core/ui/NationalityBadge"],
  ["../../i18n", "@/core/i18n"],
]);

// ----------------------------------------------------
// 9. FEATURES / SWARM
// ----------------------------------------------------
replaceInFile('features/swarm/infrastructure/actorPool.ts', [
  ["../domain/ports/IActorEventBusPort", "../domain/IActorEventBusPort"],
  ["../domain/entities/ItineraryEvent", "@/features/itinerary"],
  ["../domain/entities/CompanionShift", "@/features/companion-shifts"],
  ["../domain/entities/DriverTransfer", "@/features/logistics-fleet"],
  ["../domain/entities/ReceiptExpense", "@/features/settlement"],
  ["../domain/entities/SettlementLedger", "@/features/settlement"],
  ["../domain/value-objects/Money", "@/core/domain"],
]);

replaceInFile('features/swarm/presentation/SwarmStatusIndicator.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../../hooks/useSwarmActors", "./hooks/useSwarmActors"],
  ["../common/Badge", "@/core/ui/Badge"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/swarm/presentation/SwarmDiagnosticsModal.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Modal", "@/core/ui/Modal"],
  ["../common/Button", "@/core/ui/Button"],
  ["../../hooks/useSwarmActors", "./hooks/useSwarmActors"],
  ["../../i18n", "@/core/i18n"],
]);

replaceInFile('features/swarm/presentation/hooks/useSwarmActors.ts', [
  ["../../workers/actorPool", "../infrastructure/actorPool"],
  ["../workers/actorPool", "../infrastructure/actorPool"],
]);

// ----------------------------------------------------
// 10. FEATURES / MEDICAL-PLAN
// ----------------------------------------------------
replaceInFile('features/medical-plan/presentation/PlanView.tsx', [
  ["../../state/AppContext", "@/presentation/state/AppContext"],
  ["../common/Badge", "@/core/ui/Badge"],
  ["../common/Button", "@/core/ui/Button"],
  ["../../i18n", "@/core/i18n"],
]);

console.log('Core and Features imports updated successfully.');
