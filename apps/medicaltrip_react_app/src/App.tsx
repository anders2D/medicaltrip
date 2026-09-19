/**
 * Medical Trip Colombia S.A.S. - App Root
 * Interfaz limpia, minimalista y enfocada en Itinerarios & Liquidación en Terreno.
 * Autenticación: admin / admin.
 */

import React, { useState, useEffect } from 'react';
import { AppProvider } from './presentation/state/AppContext';
import { AuthProvider, useAuth } from './presentation/state/AuthContext';
import { LanguageProvider } from './presentation/i18n';
import { LoginView } from './presentation/components/auth/LoginView';
import { ArchetypeSwitcherBar } from './presentation/components/switcher/ArchetypeSwitcherBar';
import { ReceiptOcrModal } from './presentation/components/settlement/ReceiptOcrModal';
import { DigitalSignaturePad } from './presentation/components/settlement/DigitalSignaturePad';
import { NewPatientModal } from './presentation/components/modals/NewPatientModal';
import { SendPatientInvitationModal } from './presentation/components/modals/SendPatientInvitationModal';
import { CompanionTurnSheetModal } from './presentation/components/companion/CompanionTurnSheetModal';
import { SwarmDiagnosticsModal } from './presentation/components/swarm/SwarmDiagnosticsModal';
import { WelcomeOrientationModal } from './presentation/components/logistics/WelcomeOrientationModal';
import { ToastProvider, ToastContainer } from './presentation/state/ToastContext';
import { useAppContext } from './presentation/state/AppContext';
import { PatientSelfRegistrationView } from './presentation/components/onboarding/PatientSelfRegistrationView';
import { PatientPortalView, PatientLoginView } from './features/patient-portal';
import { CompanionModeView } from './features/companion-shifts';

// Core 4 Modules
import { SettlementView } from './presentation/components/modules/SettlementView';
import { UsersView } from './presentation/components/modules/UsersView';
import { PlanView } from './presentation/components/modules/PlanView';
import { PassengersView } from './presentation/components/modules/PassengersView';
import { ModuleNav } from './presentation/components/modules/ModuleNav';

export const MainAppLayout: React.FC = () => {
  const { user } = useAuth();
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState<boolean>(false);
  const {
    activeModule,
    activeBooking,
    activeArchetypeId,
    isCompanionTurnModalOpen,
    closeCompanionTurnModal,
    isSwarmDiagnosticsOpen,
    closeSwarmDiagnosticsModal,
    isWelcomeOrientationModalOpen,
    closeWelcomeOrientationModal,
  } = useAppContext();

  // Anti-tampering guard: patients must never access administrative layouts or modules
  useEffect(() => {
    if (user?.role === 'PATIENT') {
      if (typeof window !== 'undefined' && window.history && !window.location.pathname.includes('/portal-paciente')) {
        window.history.replaceState({}, '', '/portal-paciente');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }, [user]);

  if (user?.role === 'PATIENT') {
    return (
      <div data-testid="patient-tamper-guard" className="p-8 text-center text-sm text-zinc-500">
        Redirigiendo a su portal de paciente...
      </div>
    );
  }

  // Anti-tampering guard: companions must never access administrative layouts or modules
  if (user?.role === 'COMPANION') {
    return (
      <div data-testid="companion-tamper-guard" className="p-8 text-center text-sm text-zinc-500">
        Redirigiendo a consola en terreno...
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-zinc-100 text-zinc-950 overflow-hidden font-sans relative">
      {/* 1. Barra Superior con Logo, Pacientes y Botón Cerrar Sesión */}
      <ArchetypeSwitcherBar />

      {/* 2. Sub-Barra de Navegación de Módulos (Desktop) */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 py-2 bg-white border-b border-zinc-200 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <ModuleNav variant="desktop" />
        </div>
        <div className="text-xs text-zinc-500 font-medium">
          {activeModule === 'settlement' && 'Cuentas de cobro, horas de acompañamiento y comprobantes'}
          {activeModule === 'users' && 'Directorio de coordinación médica, guías y traslados'}
          {activeModule === 'plan' && 'Cronograma de consultas, intervenciones y triage 24/7'}
          {activeModule === 'passengers' && 'Dossier de paciente titular, acompañantes y vuelos'}
        </div>
      </div>

      {/* 3. Contenedor Principal con el Módulo Activo */}
      <main className="flex-1 overflow-y-auto bg-zinc-50/50 relative min-h-0 w-full">
        {activeModule === 'settlement' && (
          <SettlementView
            key={activeBooking?.id || activeArchetypeId}
            onOpenOcrModal={() => setIsOcrOpen(true)}
            onOpenSignatureModal={() => setIsSignatureOpen(true)}
          />
        )}
        {activeModule === 'users' && <UsersView />}
        {activeModule === 'plan' && <PlanView />}
        {activeModule === 'passengers' && <PassengersView />}
      </main>

      {/* 4. Navegación Móvil Inferior para los 4 Módulos (Solo en pantallas móviles) */}
      <div className="md:hidden">
        <ModuleNav variant="mobile" />
      </div>

      {/* 6. Modales Operativos Esenciales */}
      <ReceiptOcrModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
      />

      <DigitalSignaturePad
        isOpen={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
      />

      <NewPatientModal />

      <SendPatientInvitationModal />

      <CompanionTurnSheetModal
        isOpen={isCompanionTurnModalOpen}
        onClose={closeCompanionTurnModal}
      />

      <SwarmDiagnosticsModal
        isOpen={isSwarmDiagnosticsOpen}
        onClose={closeSwarmDiagnosticsModal}
      />

      <WelcomeOrientationModal
        isOpen={isWelcomeOrientationModalOpen}
        onClose={closeWelcomeOrientationModal}
      />

      {/* 7. Notificaciones No Invasivas con Deshacer */}
      <ToastContainer />
    </div>
  );
};

const AuthenticatedApp: React.FC<{ isPatientPortalRoute?: boolean }> = ({ isPatientPortalRoute }) => {
  const { isAuthenticated, user, isPatient, isCompanion } = useAuth();

  // Anti-tampering guard: if user role is PATIENT, strictly enforce /portal-paciente URL
  useEffect(() => {
    if (user?.role === 'PATIENT' || isPatient) {
      if (typeof window !== 'undefined' && window.history && !window.location.pathname.includes('/portal-paciente')) {
        window.history.replaceState({}, '', '/portal-paciente');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }, [user, isPatient]);

  if (!isAuthenticated) {
    if (isPatientPortalRoute) {
      return <PatientLoginView />;
    }
    return <LoginView />;
  }

  // 1. DEDICATED PATIENT PORTAL ROUTE (Role: PATIENT)
  if (isPatient || user?.role === 'PATIENT' || isPatientPortalRoute) {
    return (
      <LanguageProvider initialLanguage="es">
        <ToastProvider>
          <PatientPortalView />
        </ToastProvider>
      </LanguageProvider>
    );
  }

  // 2. DEDICATED CONSOLA OPERATIVA EN TERRENO (Role: COMPANION)
  if (isCompanion || user?.role === 'COMPANION') {
    return (
      <LanguageProvider initialLanguage="es">
        <ToastProvider>
          <CompanionModeView />
        </ToastProvider>
      </LanguageProvider>
    );
  }

  // 3. ADMIN MANAGEMENT COCKPIT (Role: ADMIN)
  return (
    <LanguageProvider initialLanguage="es">
      <ToastProvider>
        <MainAppLayout />
      </ToastProvider>
    </LanguageProvider>
  );
};

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' && window.location ? window.location.pathname : '/'
  );
  const [urlState, setUrlState] = useState<URLSearchParams | null>(() =>
    typeof window !== 'undefined' && window.location
      ? new URLSearchParams(window.location.search)
      : null
  );

  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined' && window.location) {
        setCurrentPath(window.location.pathname);
        setUrlState(new URLSearchParams(window.location.search));
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Detección reactiva y robusta de ruta de portal de paciente o parámetro reserva
  const isPatientPortalRoute =
    currentPath.startsWith('/portal-paciente') ||
    currentPath.includes('/portal-paciente') ||
    urlState?.get('portal') === 'paciente' ||
    !!urlState?.get('reserva');

  const [isSelfRegistration, setIsSelfRegistration] = useState<boolean>(() => {
    if (!urlState) return false;
    return (
      urlState.get('autogestion') === 'true' ||
      urlState.get('registro') === 'true' ||
      !!urlState.get('token') ||
      !!urlState.get('invitation')
    );
  });

  if (isSelfRegistration) {
    const initialToken = urlState?.get('token') || urlState?.get('invitation') || undefined;
    const initialName = urlState?.get('name') || undefined;
    const initialCountry = urlState?.get('country') || undefined;
    const initialLanguage = urlState?.get('lang') || undefined;
    const initialEstimatedDate = urlState?.get('date') || undefined;

    return (
      <PatientSelfRegistrationView
        initialToken={initialToken}
        initialName={initialName}
        initialCountry={initialCountry}
        initialLanguage={initialLanguage}
        initialEstimatedDate={initialEstimatedDate}
        onExit={() => {
          setIsSelfRegistration(false);
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState({}, '', window.location.pathname);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }}
      />
    );
  }

  return (
    <AuthProvider>
      <AppProvider>
        <AuthenticatedApp isPatientPortalRoute={isPatientPortalRoute} />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
