import fs from 'fs';
import path from 'path';

const APP_ROOT = '/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app';
const SRC_DIR = path.join(APP_ROOT, 'src');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copy(srcRel, destRel) {
  const src = path.join(SRC_DIR, srcRel);
  const dest = path.join(SRC_DIR, destRel);
  ensureDir(dest);
  fs.copyFileSync(src, dest);
}

function write(destRel, content) {
  const dest = path.join(SRC_DIR, destRel);
  ensureDir(dest);
  fs.writeFileSync(dest, content, 'utf8');
}

console.log('--- Step 1: Copying files to src/core ---');

// 1. core/domain
copy('domain/entities/PatientBooking.ts', 'core/domain/entities/PatientBooking.ts');
copy('domain/value-objects/Money.ts', 'core/domain/value-objects/Money.ts');
copy('domain/value-objects/OperativeTerritory.ts', 'core/domain/value-objects/OperativeTerritory.ts');
copy('domain/errors/DomainError.ts', 'core/domain/errors/DomainError.ts');
copy('domain/errors/NonOperativeTerritoryError.ts', 'core/domain/errors/NonOperativeTerritoryError.ts');

write('core/domain/index.ts', `export * from './entities/PatientBooking';
export * from './value-objects/Money';
export * from './value-objects/OperativeTerritory';
export * from './errors/DomainError';
export * from './errors/NonOperativeTerritoryError';
`);

// 2. core/ports
copy('domain/ports/IBlobStoragePort.ts', 'core/ports/IBlobStoragePort.ts');
copy('domain/ports/IStoragePersistPort.ts', 'core/ports/IStoragePersistPort.ts');
copy('domain/ports/IStoragePort.ts', 'core/ports/IStoragePort.ts');

write('core/ports/index.ts', `export * from './IBlobStoragePort';
export * from './IStoragePersistPort';
export * from './IStoragePort';
`);

// 3. core/infrastructure
copy('infrastructure/storage/DexieStorageAdapter.ts', 'core/infrastructure/storage/DexieStorageAdapter.ts');
copy('infrastructure/storage/InMemoryStorageAdapter.ts', 'core/infrastructure/storage/InMemoryStorageAdapter.ts');
copy('infrastructure/storage/WebKitPersistAdapter.ts', 'core/infrastructure/storage/WebKitPersistAdapter.ts');
copy('infrastructure/storage/LocalStorageEventStreamAdapter.ts', 'core/infrastructure/storage/LocalStorageEventStreamAdapter.ts');
copy('infrastructure/storage/SupabaseStorageAdapter.ts', 'core/infrastructure/storage/SupabaseStorageAdapter.ts');
copy('infrastructure/crdt/LWWElementSet.ts', 'core/infrastructure/crdt/LWWElementSet.ts');
copy('infrastructure/crdt/PNCounter.ts', 'core/infrastructure/crdt/PNCounter.ts');
copy('infrastructure/crdt/index.ts', 'core/infrastructure/crdt/index.ts');
copy('infrastructure/data/archetypes.data.ts', 'core/infrastructure/data/archetypes.data.ts');
copy('infrastructure/data/rates.data.ts', 'core/infrastructure/data/rates.data.ts');
copy('infrastructure/ServiceContainer.ts', 'core/infrastructure/ServiceContainer.ts');

write('core/infrastructure/index.ts', `export * from './storage/DexieStorageAdapter';
export * from './storage/InMemoryStorageAdapter';
export * from './storage/WebKitPersistAdapter';
export * from './storage/LocalStorageEventStreamAdapter';
export * from './storage/SupabaseStorageAdapter';
export * from './crdt';
export * from './data/archetypes.data';
export * from './data/rates.data';
export * from './ServiceContainer';
`);

// 4. core/auth
copy('presentation/state/AuthContext.tsx', 'core/auth/AuthContext.tsx');
copy('presentation/components/auth/LoginView.tsx', 'core/auth/LoginView.tsx');

write('core/auth/index.ts', `export * from './AuthContext';
export * from './LoginView';
`);

// 5. core/i18n
copy('presentation/i18n/LanguageContext.tsx', 'core/i18n/LanguageContext.tsx');
copy('presentation/i18n/types.ts', 'core/i18n/types.ts');
copy('presentation/i18n/translations/en.ts', 'core/i18n/translations/en.ts');
copy('presentation/i18n/translations/es.ts', 'core/i18n/translations/es.ts');
copy('presentation/i18n/translations/nl.ts', 'core/i18n/translations/nl.ts');
copy('presentation/i18n/translations/pap.ts', 'core/i18n/translations/pap.ts');

write('core/i18n/index.ts', `export * from './LanguageContext';
export * from './types';
export * from './translations/en';
export * from './translations/es';
export * from './translations/nl';
export * from './translations/pap';
`);

// 6. core/ui
copy('presentation/components/common/Button.tsx', 'core/ui/Button.tsx');
copy('presentation/components/common/Input.tsx', 'core/ui/Input.tsx');
copy('presentation/components/common/Modal.tsx', 'core/ui/Modal.tsx');
copy('presentation/components/common/Select.tsx', 'core/ui/Select.tsx');
copy('presentation/components/common/Badge.tsx', 'core/ui/Badge.tsx');
copy('presentation/components/badges/LanguageBadge.tsx', 'core/ui/LanguageBadge.tsx');
copy('presentation/components/badges/NationalityBadge.tsx', 'core/ui/NationalityBadge.tsx');
copy('presentation/components/language/LanguageSwitcher.tsx', 'core/ui/LanguageSwitcher.tsx');

write('core/ui/index.ts', `export * from './Button';
export * from './Input';
export * from './Modal';
export * from './Select';
export * from './Badge';
export * from './LanguageBadge';
export * from './NationalityBadge';
export * from './LanguageSwitcher';
`);

// 7. core/index.ts
write('core/index.ts', `export * from './domain';
export * from './ports';
export * from './infrastructure';
export * from './auth';
export * from './i18n';
export * from './ui';
`);

console.log('--- Step 2: Copying files to src/features ---');

// Feature 1: settlement
copy('domain/entities/SettlementLedger.ts', 'features/settlement/domain/SettlementLedger.ts');
copy('domain/entities/ReceiptExpense.ts', 'features/settlement/domain/ReceiptExpense.ts');
copy('domain/ports/IExportPort.ts', 'features/settlement/domain/IExportPort.ts');
copy('domain/ports/IOCRPort.ts', 'features/settlement/domain/IOCRPort.ts');

copy('application/use-cases/OneTapSettlementWorkflowUseCase.ts', 'features/settlement/application/OneTapSettlementWorkflowUseCase.ts');
copy('application/use-cases/ExportSettlementPDFUseCase.ts', 'features/settlement/application/ExportSettlementPDFUseCase.ts');
copy('application/use-cases/ReconcileSettlementUseCase.ts', 'features/settlement/application/ReconcileSettlementUseCase.ts');
copy('application/use-cases/SettleExpenseUseCase.ts', 'features/settlement/application/SettleExpenseUseCase.ts');

copy('infrastructure/export/JsonPdfExportAdapter.ts', 'features/settlement/infrastructure/JsonPdfExportAdapter.ts');
copy('infrastructure/ocr/SimulatedReceiptOCRAdapter.ts', 'features/settlement/infrastructure/SimulatedReceiptOCRAdapter.ts');
copy('infrastructure/security/Sha256LedgerChain.ts', 'features/settlement/infrastructure/Sha256LedgerChain.ts');

copy('presentation/components/settlement/DockedSettlementBar.tsx', 'features/settlement/presentation/DockedSettlementBar.tsx');
copy('presentation/components/settlement/ReceiptOcrModal.tsx', 'features/settlement/presentation/ReceiptOcrModal.tsx');
copy('presentation/components/settlement/DigitalSignaturePad.tsx', 'features/settlement/presentation/DigitalSignaturePad.tsx');
copy('presentation/components/settlement/SettlementKpiCards.tsx', 'features/settlement/presentation/SettlementKpiCards.tsx');
copy('presentation/components/modules/SettlementView.tsx', 'features/settlement/presentation/SettlementView.tsx');
copy('presentation/hooks/useSettlement.ts', 'features/settlement/presentation/hooks/useSettlement.ts');
copy('presentation/hooks/useConfetti.ts', 'features/settlement/presentation/hooks/useConfetti.ts');

write('features/settlement/index.ts', `// Domain
export * from './domain/SettlementLedger';
export * from './domain/ReceiptExpense';
export * from './domain/IExportPort';
export * from './domain/IOCRPort';

// Application
export * from './application/OneTapSettlementWorkflowUseCase';
export * from './application/ExportSettlementPDFUseCase';
export * from './application/ReconcileSettlementUseCase';
export * from './application/SettleExpenseUseCase';

// Infrastructure
export * from './infrastructure/JsonPdfExportAdapter';
export * from './infrastructure/SimulatedReceiptOCRAdapter';
export * from './infrastructure/Sha256LedgerChain';

// Presentation
export * from './presentation/DockedSettlementBar';
export * from './presentation/ReceiptOcrModal';
export * from './presentation/DigitalSignaturePad';
export * from './presentation/SettlementKpiCards';
export * from './presentation/SettlementView';
export * from './presentation/hooks/useSettlement';
export * from './presentation/hooks/useConfetti';
`);

// Feature 2: itinerary
copy('domain/entities/ItineraryEvent.ts', 'features/itinerary/domain/ItineraryEvent.ts');
copy('domain/value-objects/EventCategory.ts', 'features/itinerary/domain/EventCategory.ts');
copy('domain/value-objects/EventStatus.ts', 'features/itinerary/domain/EventStatus.ts');

copy('application/use-cases/CreateEventUseCase.ts', 'features/itinerary/application/CreateEventUseCase.ts');
copy('application/use-cases/GenerateSmartItineraryUseCase.ts', 'features/itinerary/application/GenerateSmartItineraryUseCase.ts');
copy('application/use-cases/RescheduleEventUseCase.ts', 'features/itinerary/application/RescheduleEventUseCase.ts');
copy('application/use-cases/SignOffItineraryUseCase.ts', 'features/itinerary/application/SignOffItineraryUseCase.ts');

copy('presentation/components/calendar/CalendarContainer.tsx', 'features/itinerary/presentation/CalendarContainer.tsx');
copy('presentation/components/calendar/CalendarHeader.tsx', 'features/itinerary/presentation/CalendarHeader.tsx');
copy('presentation/components/calendar/MonthView.tsx', 'features/itinerary/presentation/MonthView.tsx');
copy('presentation/components/calendar/WeekView.tsx', 'features/itinerary/presentation/WeekView.tsx');
copy('presentation/components/calendar/DayView.tsx', 'features/itinerary/presentation/DayView.tsx');
copy('presentation/components/calendar/AgendaView.tsx', 'features/itinerary/presentation/AgendaView.tsx');
copy('presentation/components/calendar/EventCard.tsx', 'features/itinerary/presentation/EventCard.tsx');
copy('presentation/components/calendar/EventHoverCard.tsx', 'features/itinerary/presentation/EventHoverCard.tsx');
copy('presentation/components/calendar/GhostDropIndicator.tsx', 'features/itinerary/presentation/GhostDropIndicator.tsx');
copy('presentation/components/drawer/EventDetailDrawer.tsx', 'features/itinerary/presentation/EventDetailDrawer.tsx');
copy('presentation/components/drawer/EventForm.tsx', 'features/itinerary/presentation/EventForm.tsx');
copy('presentation/components/modals/SmartItineraryModal.tsx', 'features/itinerary/presentation/SmartItineraryModal.tsx');
copy('presentation/components/timezone/DualTimezoneChip.tsx', 'features/itinerary/presentation/DualTimezoneChip.tsx');
copy('presentation/hooks/useItinerary.ts', 'features/itinerary/presentation/hooks/useItinerary.ts');

write('features/itinerary/index.ts', `// Domain
export * from './domain/ItineraryEvent';
export * from './domain/EventCategory';
export * from './domain/EventStatus';

// Application
export * from './application/CreateEventUseCase';
export * from './application/GenerateSmartItineraryUseCase';
export * from './application/RescheduleEventUseCase';
export * from './application/SignOffItineraryUseCase';

// Presentation
export * from './presentation/CalendarContainer';
export * from './presentation/CalendarHeader';
export * from './presentation/MonthView';
export * from './presentation/WeekView';
export * from './presentation/DayView';
export * from './presentation/AgendaView';
export * from './presentation/EventCard';
export * from './presentation/EventHoverCard';
export * from './presentation/GhostDropIndicator';
export * from './presentation/EventDetailDrawer';
export * from './presentation/EventForm';
export * from './presentation/SmartItineraryModal';
export * from './presentation/DualTimezoneChip';
export * from './presentation/hooks/useItinerary';
`);

// Feature 3: medical-plan
copy('presentation/components/modules/PlanView.tsx', 'features/medical-plan/presentation/PlanView.tsx');

write('features/medical-plan/index.ts', `export * from './presentation/PlanView';
`);

// Feature 4: logistics-fleet
copy('domain/entities/DriverTransfer.ts', 'features/logistics-fleet/domain/DriverTransfer.ts');
copy('application/use-cases/PerformDriverCheckInUseCase.ts', 'features/logistics-fleet/application/PerformDriverCheckInUseCase.ts');
copy('presentation/components/logistics/ArrivalTrackingCard.tsx', 'features/logistics-fleet/presentation/ArrivalTrackingCard.tsx');
copy('presentation/components/logistics/DriverCheckInAction.tsx', 'features/logistics-fleet/presentation/DriverCheckInAction.tsx');
copy('presentation/components/logistics/WelcomeOrientationModal.tsx', 'features/logistics-fleet/presentation/WelcomeOrientationModal.tsx');
copy('presentation/components/logistics/OrientationKitPreview.tsx', 'features/logistics-fleet/presentation/OrientationKitPreview.tsx');

write('features/logistics-fleet/index.ts', `// Domain
export * from './domain/DriverTransfer';

// Application
export * from './application/PerformDriverCheckInUseCase';

// Presentation
export * from './presentation/ArrivalTrackingCard';
export * from './presentation/DriverCheckInAction';
export * from './presentation/WelcomeOrientationModal';
export * from './presentation/OrientationKitPreview';
`);

// Feature 5: companion-shifts
copy('domain/entities/CompanionShift.ts', 'features/companion-shifts/domain/CompanionShift.ts');
copy('presentation/components/companion/CompanionTurnSheetModal.tsx', 'features/companion-shifts/presentation/CompanionTurnSheetModal.tsx');
copy('presentation/components/companion/MealSubsidySelector.tsx', 'features/companion-shifts/presentation/MealSubsidySelector.tsx');

write('features/companion-shifts/index.ts', `// Domain
export * from './domain/CompanionShift';

// Presentation
export * from './presentation/CompanionTurnSheetModal';
export * from './presentation/MealSubsidySelector';
`);

// Feature 6: onboarding
copy('domain/entities/PatientInvitation.ts', 'features/onboarding/domain/PatientInvitation.ts');
copy('domain/ports/IPatientInvitationRepository.ts', 'features/onboarding/domain/IPatientInvitationRepository.ts');
copy('application/use-cases/CreatePatientInvitationUseCase.ts', 'features/onboarding/application/CreatePatientInvitationUseCase.ts');
copy('application/use-cases/GetPatientInvitationUseCase.ts', 'features/onboarding/application/GetPatientInvitationUseCase.ts');
copy('application/use-cases/CreatePatientBookingUseCase.ts', 'features/onboarding/application/CreatePatientBookingUseCase.ts');
copy('infrastructure/storage/LocalStoragePatientInvitationAdapter.ts', 'features/onboarding/infrastructure/LocalStoragePatientInvitationAdapter.ts');
copy('infrastructure/storage/SupabasePatientInvitationAdapter.ts', 'features/onboarding/infrastructure/SupabasePatientInvitationAdapter.ts');
copy('presentation/components/onboarding/PatientSelfRegistrationView.tsx', 'features/onboarding/presentation/PatientSelfRegistrationView.tsx');
copy('presentation/components/modals/SendPatientInvitationModal.tsx', 'features/onboarding/presentation/SendPatientInvitationModal.tsx');
copy('presentation/components/modals/NewPatientModal.tsx', 'features/onboarding/presentation/NewPatientModal.tsx');

write('features/onboarding/index.ts', `// Domain
export * from './domain/PatientInvitation';
export * from './domain/IPatientInvitationRepository';

// Application
export * from './application/CreatePatientInvitationUseCase';
export * from './application/GetPatientInvitationUseCase';
export * from './application/CreatePatientBookingUseCase';

// Infrastructure
export * from './infrastructure/LocalStoragePatientInvitationAdapter';
export * from './infrastructure/SupabasePatientInvitationAdapter';

// Presentation
export * from './presentation/PatientSelfRegistrationView';
export * from './presentation/SendPatientInvitationModal';
export * from './presentation/NewPatientModal';
`);

// Feature 7: directory
copy('infrastructure/data/providers.data.ts', 'features/directory/infrastructure/providers.data.ts');
copy('presentation/components/modules/UsersView.tsx', 'features/directory/presentation/UsersView.tsx');
copy('presentation/components/modules/PassengersView.tsx', 'features/directory/presentation/PassengersView.tsx');

write('features/directory/index.ts', `// Infrastructure
export * from './infrastructure/providers.data';

// Presentation
export * from './presentation/UsersView';
export * from './presentation/PassengersView';
`);

// Feature 8: swarm
copy('domain/ports/IActorEventBusPort.ts', 'features/swarm/domain/IActorEventBusPort.ts');
copy('workers/actorPool.ts', 'features/swarm/infrastructure/actorPool.ts');
copy('workers/driverActor.worker.ts', 'features/swarm/infrastructure/driverActor.worker.ts');
copy('workers/financialAuditorActor.worker.ts', 'features/swarm/infrastructure/financialAuditorActor.worker.ts');
copy('workers/guideActor.worker.ts', 'features/swarm/infrastructure/guideActor.worker.ts');
copy('workers/nurseActor.worker.ts', 'features/swarm/infrastructure/nurseActor.worker.ts');
copy('presentation/components/swarm/SwarmStatusIndicator.tsx', 'features/swarm/presentation/SwarmStatusIndicator.tsx');
copy('presentation/components/swarm/SwarmDiagnosticsModal.tsx', 'features/swarm/presentation/SwarmDiagnosticsModal.tsx');
copy('presentation/hooks/useSwarmActors.ts', 'features/swarm/presentation/hooks/useSwarmActors.ts');

write('features/swarm/index.ts', `// Domain
export * from './domain/IActorEventBusPort';

// Infrastructure
export * from './infrastructure/actorPool';
export * from './infrastructure/driverActor.worker';
export * from './infrastructure/financialAuditorActor.worker';
export * from './infrastructure/guideActor.worker';
export * from './infrastructure/nurseActor.worker';

// Presentation
export * from './presentation/SwarmStatusIndicator';
export * from './presentation/SwarmDiagnosticsModal';
export * from './presentation/hooks/useSwarmActors';
`);

console.log('Files copied and feature barrels written successfully.');
