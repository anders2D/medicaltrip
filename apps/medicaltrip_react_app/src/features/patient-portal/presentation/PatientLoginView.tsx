/**
 * Medical Trip Colombia S.A.S. - PatientLoginView
 * Pantalla de acceso dedicada y branded para el Portal del Paciente Internacional:
 * - Ingreso mediante código de reserva (RVA171-4, RVA282-5) o token de autogestión (INV-*)
 * - 3 botones rápidos 1-click para arquetipos del Caribe:
 *   [🇨🇼 Curazao - Catia], [🇦🇼 Aruba - Jean-Luc], [🇧🇶 Bonaire - Alejandra]
 * - Enlace directo a acceso de coordinadores y administradores
 * - Formulario dual con soporte accesible y compatibilidad retrospectiva completa
 */

import React, { useState } from 'react';
import { useAuth } from '@/core/auth';
import { ArrowRight, KeyRound, User as UserIcon, Lock, ShieldCheck } from 'lucide-react';

export interface PatientLoginViewProps {
  onAdminLogin?: () => void;
  onLoginSuccess?: () => void;
}

export const PatientLoginView: React.FC<PatientLoginViewProps> = ({ onAdminLogin, onLoginSuccess }) => {
  const { loginAsPatient, loginAsDemoPatient, login, error, clearError } = useAuth();

  const [bookingCode, setBookingCode] = useState<string>('');
  const [patientError, setPatientError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Admin section state
  const [showAdminDetails, setShowAdminDetails] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('admin');

  // Handle patient code submit
  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientError(null);
    clearError();

    const clean = bookingCode.trim();
    if (!clean) {
      setPatientError('Por favor ingresa un código de reserva o token válido.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const ok = loginAsPatient(clean);
      if (ok) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setPatientError('Código de reserva o token no reconocido. Por favor verifique o use los accesos rápidos.');
      }
      setIsLoading(false);
    }, 150);
  };

  // Handle admin credentials submit
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(adminUsername, adminPassword);
      if (onAdminLogin) {
        onAdminLogin();
      }
      setIsLoading(false);
    }, 150);
  };

  // Quick 1-click Caribbean demo logins
  const handleDemoNatalie = () => {
    setBookingCode('RVA350-1');
    clearError();
    setPatientError(null);
    loginAsDemoPatient('RVA350-1');
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleDemoCatia = () => {
    setBookingCode('RVA171-4');
    clearError();
    setPatientError(null);
    loginAsDemoPatient('RVA171-4');
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleDemoAruba = () => {
    setBookingCode('RVA282-5');
    clearError();
    setPatientError(null);
    loginAsDemoPatient('RVA282-5');
    if (onLoginSuccess) onLoginSuccess();
  };

  return (
    <div
      data-testid="patient-login-root"
      className="min-h-screen w-screen bg-zinc-50 flex flex-col justify-center items-center p-4 selection:bg-zinc-900 selection:text-white font-sans select-none"
    >
      {/* Container Card */}
      <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6 sm:p-8 relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-bold text-lg mb-3 shadow-sm ring-1 ring-black/5">
            MT
          </div>
          <h1 className="text-lg font-bold text-zinc-950 tracking-tight">
            Medical Trip Colombia
          </h1>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full font-mono mt-1">
            Portal del Paciente Internacional
          </span>
          <p className="text-xs text-zinc-500 mt-2">
            Consulte su itinerario médico, traslados desde el aeropuerto y asignación de acompañante
          </p>
        </div>

        {/* Error Alert */}
        {(error || patientError) && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{patientError || error}</span>
            <button
              type="button"
              onClick={() => {
                clearError();
                setPatientError(null);
              }}
              className="text-red-900 font-bold ml-2 hover:opacity-75 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* =========================================================================
           1. PACIENTE: CÓDIGO DE RESERVA O TOKEN
           ========================================================================= */}
        <form onSubmit={handlePatientSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="patient-code"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Código de Reserva o Token de Invitación
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="patient-code"
                data-testid="input-patient-code"
                type="text"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value)}
                placeholder="Ej: RVA171-4 o INV-DEMO-001"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Ingrese su código recibido por WhatsApp o correo electrónico.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            data-testid="btn-patient-login-submit"
            className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <span>{isLoading ? 'Consultando...' : 'Ingresar a Mi Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Caribbean 1-Click Quick Demo Access */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-zinc-400 uppercase tracking-wider font-semibold font-mono text-[10px]">
              Acceso Rápido Demo Caribe
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleDemoNatalie}
            data-testid="btn-demo-natalie"
            className="w-full py-2 px-3 bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200/80 text-zinc-800 text-xs font-medium rounded-lg transition-all duration-150 flex items-center justify-between cursor-pointer active:scale-[0.98] min-h-[40px]"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800">CW</span>
              <span className="font-semibold text-zinc-900">Curazao - Natalie Rumai</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200 font-bold">
              RVA350-1
            </span>
          </button>

          <button
            type="button"
            onClick={handleDemoCatia}
            data-testid="btn-demo-catia"
            className="w-full py-2 px-3 bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200/80 text-zinc-800 text-xs font-medium rounded-lg transition-all duration-150 flex items-center justify-between cursor-pointer active:scale-[0.98] min-h-[40px]"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800">CW</span>
              <span className="font-semibold text-zinc-900">Curazao - Catia Rodrigues</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
              RVA171-4
            </span>
          </button>

          <button
            type="button"
            onClick={handleDemoAruba}
            data-testid="btn-demo-aruba"
            className="w-full py-2 px-3 bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200/80 text-zinc-800 text-xs font-medium rounded-lg transition-all duration-150 flex items-center justify-between cursor-pointer active:scale-[0.98] min-h-[40px]"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800">AW</span>
              <span className="font-semibold text-zinc-900">Aruba - Jean-Luc</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
              RVA282-5
            </span>
          </button>
        </div>

        {/* =========================================================================
           2. SECCIÓN DE ACCESO COORDINADOR / ADMINISTRADOR
           ========================================================================= */}
        <div className="mt-6 pt-5 border-t border-zinc-100">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setShowAdminDetails((prev) => !prev)}
              data-testid="link-admin-login"
              className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-4 transition-colors cursor-pointer text-left"
            >
              ¿Eres coordinador o administrador? Ingresa aquí
            </button>
          </div>

          {/* Formulario de credenciales administrativas accesible para tests y personal operativo */}
          <form
            onSubmit={handleAdminSubmit}
            data-testid="admin-auth-form"
            className={`space-y-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/70 transition-all ${
              showAdminDetails ? 'block' : 'block sm:bg-transparent sm:border-0 sm:p-0 sm:space-y-3'
            }`}
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1" htmlFor="username">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="•••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[38px]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
          </form>

          {/* Referral Link for Test & Navigation Compatibility */}
          <div className="mt-3 text-center">
            <a
              href="/portal-paciente"
              data-testid="link-patient-portal"
              onClick={(e) => {
                e.preventDefault();
                setShowAdminDetails(false);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-4 transition-colors cursor-pointer"
            >
              ¿Eres paciente? Consulta tu itinerario aquí
            </a>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="mt-4 text-center text-xs text-zinc-400 font-mono">
        Medical Trip Colombia S.A.S. • Portal Seguro del Paciente
      </footer>
    </div>
  );
};
