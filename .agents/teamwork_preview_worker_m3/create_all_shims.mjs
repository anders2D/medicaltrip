import fs from 'fs';
import path from 'path';

const APP_ROOT = '/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app';
const SRC_DIR = path.join(APP_ROOT, 'src');

function writeShim(relFile, targetPath, hasDefault = false) {
  const fullPath = path.join(SRC_DIR, relFile);
  let content = `export * from '${targetPath}';\n`;
  if (hasDefault) {
    content += `export { default } from '${targetPath}';\n`;
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Shim created: ${relFile} -> ${targetPath}`);
}

// 1. Domain Entities
writeShim('domain/entities/CompanionShift.ts', '../../features/companion-shifts/domain/CompanionShift');
writeShim('domain/entities/DriverTransfer.ts', '../../features/logistics-fleet/domain/DriverTransfer');
writeShim('domain/entities/ItineraryEvent.ts', '../../features/itinerary/domain/ItineraryEvent');
writeShim('domain/entities/PatientBooking.ts', '../../core/domain/entities/PatientBooking');
writeShim('domain/entities/PatientInvitation.ts', '../../features/onboarding/domain/PatientInvitation');
writeShim('domain/entities/ReceiptExpense.ts', '../../features/settlement/domain/ReceiptExpense');
writeShim('domain/entities/SettlementLedger.ts', '../../features/settlement/domain/SettlementLedger', true);

// 2. Domain Errors
writeShim('domain/errors/DomainError.ts', '../../core/domain/errors/DomainError');
writeShim('domain/errors/NonOperativeTerritoryError.ts', '../../core/domain/errors/NonOperativeTerritoryError');

// 3. Domain Ports
writeShim('domain/ports/IActorEventBusPort.ts', '../../features/swarm/domain/IActorEventBusPort');
writeShim('domain/ports/IBlobStoragePort.ts', '../../core/ports/IBlobStoragePort');
writeShim('domain/ports/IExportPort.ts', '../../features/settlement/domain/IExportPort');
writeShim('domain/ports/IOCRPort.ts', '../../features/settlement/domain/IOCRPort');
writeShim('domain/ports/IPatientInvitationRepository.ts', '../../features/onboarding/domain/IPatientInvitationRepository');
writeShim('domain/ports/IStoragePersistPort.ts', '../../core/ports/IStoragePersistPort');
writeShim('domain/ports/IStoragePort.ts', '../../core/ports/IStoragePort');

// 4. Domain Value Objects
writeShim('domain/value-objects/EventCategory.ts', '../../features/itinerary/domain/EventCategory');
writeShim('domain/value-objects/EventStatus.ts', '../../features/itinerary/domain/EventStatus');
writeShim('domain/value-objects/Money.ts', '../../core/domain/value-objects/Money');
writeShim('domain/value-objects/OperativeTerritory.ts', '../../core/domain/value-objects/OperativeTerritory');

// 5. Domain Index
const domainIndex = `// Errors
export * from './errors/DomainError';
export * from './errors/NonOperativeTerritoryError';

// Value Objects
export * from './value-objects/Money';
export * from './value-objects/OperativeTerritory';
export * from './value-objects/EventCategory';
export * from './value-objects/EventStatus';

// Entities & Aggregates
export * from './entities/PatientBooking';
export * from './entities/ItineraryEvent';
export * from './entities/CompanionShift';
export * from './entities/DriverTransfer';
export * from './entities/ReceiptExpense';
export * from './entities/SettlementLedger';

// Ports
export * from './ports/IStoragePort';
export * from './ports/IBlobStoragePort';
export * from './ports/IActorEventBusPort';
export * from './ports/IOCRPort';
export * from './ports/IExportPort';
export * from './ports/IStoragePersistPort';
export * from './ports/IPatientInvitationRepository';
`;
fs.writeFileSync(path.join(SRC_DIR, 'domain/index.ts'), domainIndex, 'utf8');

// 6. Application Use Cases
writeShim('application/use-cases/CreateEventUseCase.ts', '../../features/itinerary/application/CreateEventUseCase');
writeShim('application/use-cases/CreatePatientBookingUseCase.ts', '../../features/onboarding/application/CreatePatientBookingUseCase');
writeShim('application/use-cases/CreatePatientInvitationUseCase.ts', '../../features/onboarding/application/CreatePatientInvitationUseCase');
writeShim('application/use-cases/ExportSettlementPDFUseCase.ts', '../../features/settlement/application/ExportSettlementPDFUseCase');
writeShim('application/use-cases/GenerateSmartItineraryUseCase.ts', '../../features/itinerary/application/GenerateSmartItineraryUseCase');
writeShim('application/use-cases/GetPatientInvitationUseCase.ts', '../../features/onboarding/application/GetPatientInvitationUseCase');
writeShim('application/use-cases/OneTapSettlementWorkflowUseCase.ts', '../../features/settlement/application/OneTapSettlementWorkflowUseCase');
writeShim('application/use-cases/PerformDriverCheckInUseCase.ts', '../../features/logistics-fleet/application/PerformDriverCheckInUseCase');
writeShim('application/use-cases/ReconcileSettlementUseCase.ts', '../../features/settlement/application/ReconcileSettlementUseCase');
writeShim('application/use-cases/RescheduleEventUseCase.ts', '../../features/itinerary/application/RescheduleEventUseCase');
writeShim('application/use-cases/SettleExpenseUseCase.ts', '../../features/settlement/application/SettleExpenseUseCase');
writeShim('application/use-cases/SignOffItineraryUseCase.ts', '../../features/itinerary/application/SignOffItineraryUseCase');

// 7. Infrastructure
writeShim('infrastructure/ServiceContainer.ts', '../core/infrastructure/ServiceContainer');
writeShim('infrastructure/storage/DexieStorageAdapter.ts', '../../core/infrastructure/storage/DexieStorageAdapter');
writeShim('infrastructure/storage/InMemoryStorageAdapter.ts', '../../core/infrastructure/storage/InMemoryStorageAdapter');
writeShim('infrastructure/storage/WebKitPersistAdapter.ts', '../../core/infrastructure/storage/WebKitPersistAdapter');
writeShim('infrastructure/storage/LocalStorageEventStreamAdapter.ts', '../../core/infrastructure/storage/LocalStorageEventStreamAdapter');
writeShim('infrastructure/storage/SupabaseStorageAdapter.ts', '../../core/infrastructure/storage/SupabaseStorageAdapter');
writeShim('infrastructure/storage/LocalStoragePatientInvitationAdapter.ts', '../../features/onboarding/infrastructure/LocalStoragePatientInvitationAdapter');
writeShim('infrastructure/storage/SupabasePatientInvitationAdapter.ts', '../../features/onboarding/infrastructure/SupabasePatientInvitationAdapter');
writeShim('infrastructure/crdt/LWWElementSet.ts', '../../core/infrastructure/crdt/LWWElementSet');
writeShim('infrastructure/crdt/PNCounter.ts', '../../core/infrastructure/crdt/PNCounter');
writeShim('infrastructure/crdt/index.ts', '../../core/infrastructure/crdt');
writeShim('infrastructure/data/archetypes.data.ts', '../../core/infrastructure/data/archetypes.data');
writeShim('infrastructure/data/rates.data.ts', '../../core/infrastructure/data/rates.data');
writeShim('infrastructure/data/providers.data.ts', '../../features/directory/infrastructure/providers.data');
writeShim('infrastructure/export/JsonPdfExportAdapter.ts', '../../features/settlement/infrastructure/JsonPdfExportAdapter');
writeShim('infrastructure/ocr/SimulatedReceiptOCRAdapter.ts', '../../features/settlement/infrastructure/SimulatedReceiptOCRAdapter');
writeShim('infrastructure/security/Sha256LedgerChain.ts', '../../features/settlement/infrastructure/Sha256LedgerChain');

// 8. Presentation Components & Hooks
writeShim('presentation/components/common/Button.tsx', '../../../core/ui/Button');
writeShim('presentation/components/common/Input.tsx', '../../../core/ui/Input');
writeShim('presentation/components/common/Modal.tsx', '../../../core/ui/Modal');
writeShim('presentation/components/common/Select.tsx', '../../../core/ui/Select');
writeShim('presentation/components/common/Badge.tsx', '../../../core/ui/Badge');
writeShim('presentation/components/common/index.ts', '../../../core/ui');

writeShim('presentation/components/badges/LanguageBadge.tsx', '../../../core/ui/LanguageBadge', true);
writeShim('presentation/components/badges/NationalityBadge.tsx', '../../../core/ui/NationalityBadge', true);
writeShim('presentation/components/badges/index.ts', '../../../core/ui');

writeShim('presentation/components/language/LanguageSwitcher.tsx', '../../../core/ui/LanguageSwitcher', true);
writeShim('presentation/components/language/index.ts', '../../../core/ui');

writeShim('presentation/components/auth/LoginView.tsx', '../../../core/auth/LoginView');
writeShim('presentation/state/AuthContext.tsx', '../../core/auth/AuthContext');

writeShim('presentation/components/settlement/DockedSettlementBar.tsx', '../../../features/settlement/presentation/DockedSettlementBar', true);
writeShim('presentation/components/settlement/ReceiptOcrModal.tsx', '../../../features/settlement/presentation/ReceiptOcrModal', true);
writeShim('presentation/components/settlement/DigitalSignaturePad.tsx', '../../../features/settlement/presentation/DigitalSignaturePad', true);
writeShim('presentation/components/settlement/SettlementKpiCards.tsx', '../../../features/settlement/presentation/SettlementKpiCards');
writeShim('presentation/components/settlement/index.ts', '../../../features/settlement');

writeShim('presentation/components/calendar/CalendarContainer.tsx', '../../../features/itinerary/presentation/CalendarContainer');
writeShim('presentation/components/calendar/CalendarHeader.tsx', '../../../features/itinerary/presentation/CalendarHeader');
writeShim('presentation/components/calendar/MonthView.tsx', '../../../features/itinerary/presentation/MonthView');
writeShim('presentation/components/calendar/WeekView.tsx', '../../../features/itinerary/presentation/WeekView');
writeShim('presentation/components/calendar/DayView.tsx', '../../../features/itinerary/presentation/DayView');
writeShim('presentation/components/calendar/AgendaView.tsx', '../../../features/itinerary/presentation/AgendaView');
writeShim('presentation/components/calendar/EventCard.tsx', '../../../features/itinerary/presentation/EventCard');
writeShim('presentation/components/calendar/EventHoverCard.tsx', '../../../features/itinerary/presentation/EventHoverCard');
writeShim('presentation/components/calendar/GhostDropIndicator.tsx', '../../../features/itinerary/presentation/GhostDropIndicator');
writeShim('presentation/components/calendar/index.ts', '../../../features/itinerary');

writeShim('presentation/components/drawer/EventDetailDrawer.tsx', '../../../features/itinerary/presentation/EventDetailDrawer');
writeShim('presentation/components/drawer/EventForm.tsx', '../../../features/itinerary/presentation/EventForm');
writeShim('presentation/components/drawer/index.ts', '../../../features/itinerary');

writeShim('presentation/components/modals/SmartItineraryModal.tsx', '../../../features/itinerary/presentation/SmartItineraryModal', true);
writeShim('presentation/components/modal/SmartItineraryModal.tsx', '../../../features/itinerary/presentation/SmartItineraryModal', true);
writeShim('presentation/components/timezone/DualTimezoneChip.tsx', '../../../features/itinerary/presentation/DualTimezoneChip', true);
writeShim('presentation/components/timezone/index.ts', '../../../features/itinerary');

writeShim('presentation/components/logistics/ArrivalTrackingCard.tsx', '../../../features/logistics-fleet/presentation/ArrivalTrackingCard');
writeShim('presentation/components/logistics/DriverCheckInAction.tsx', '../../../features/logistics-fleet/presentation/DriverCheckInAction');
writeShim('presentation/components/logistics/WelcomeOrientationModal.tsx', '../../../features/logistics-fleet/presentation/WelcomeOrientationModal');
writeShim('presentation/components/logistics/OrientationKitPreview.tsx', '../../../features/logistics-fleet/presentation/OrientationKitPreview');
writeShim('presentation/components/logistics/index.ts', '../../../features/logistics-fleet');

writeShim('presentation/components/companion/CompanionTurnSheetModal.tsx', '../../../features/companion-shifts/presentation/CompanionTurnSheetModal');
writeShim('presentation/components/companion/MealSubsidySelector.tsx', '../../../features/companion-shifts/presentation/MealSubsidySelector');
writeShim('presentation/components/companion/index.ts', '../../../features/companion-shifts');

writeShim('presentation/components/onboarding/PatientSelfRegistrationView.tsx', '../../../features/onboarding/presentation/PatientSelfRegistrationView', true);
writeShim('presentation/components/modals/SendPatientInvitationModal.tsx', '../../../features/onboarding/presentation/SendPatientInvitationModal');
writeShim('presentation/components/modals/NewPatientModal.tsx', '../../../features/onboarding/presentation/NewPatientModal', true);
writeShim('presentation/components/modal/NewPatientModal.tsx', '../../../features/onboarding/presentation/NewPatientModal', true);

writeShim('presentation/components/modules/SettlementView.tsx', '../../../features/settlement/presentation/SettlementView');
writeShim('presentation/components/modules/PlanView.tsx', '../../../features/medical-plan/presentation/PlanView');
writeShim('presentation/components/modules/UsersView.tsx', '../../../features/directory/presentation/UsersView');
writeShim('presentation/components/modules/PassengersView.tsx', '../../../features/directory/presentation/PassengersView');

writeShim('presentation/components/swarm/SwarmStatusIndicator.tsx', '../../../features/swarm/presentation/SwarmStatusIndicator');
writeShim('presentation/components/swarm/SwarmDiagnosticsModal.tsx', '../../../features/swarm/presentation/SwarmDiagnosticsModal');
writeShim('presentation/components/swarm/index.ts', '../../../features/swarm');

writeShim('presentation/hooks/useSettlement.ts', '../../features/settlement/presentation/hooks/useSettlement');
writeShim('presentation/hooks/useConfetti.ts', '../../features/settlement/presentation/hooks/useConfetti', true);
writeShim('presentation/hooks/useItinerary.ts', '../../features/itinerary/presentation/hooks/useItinerary');
writeShim('presentation/hooks/useSwarmActors.ts', '../../features/swarm/presentation/hooks/useSwarmActors');

// 9. Workers
writeShim('workers/actorPool.ts', '../features/swarm/infrastructure/actorPool');
writeShim('workers/driverActor.worker.ts', '../features/swarm/infrastructure/driverActor.worker');
writeShim('workers/financialAuditorActor.worker.ts', '../features/swarm/infrastructure/financialAuditorActor.worker');
writeShim('workers/guideActor.worker.ts', '../features/swarm/infrastructure/guideActor.worker');
writeShim('workers/nurseActor.worker.ts', '../features/swarm/infrastructure/nurseActor.worker');

console.log('All legacy shims created successfully.');
