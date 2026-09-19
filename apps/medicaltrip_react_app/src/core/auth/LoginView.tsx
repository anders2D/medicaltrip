/**
 * Medical Trip Colombia S.A.S. - LoginView
 * Pantalla de inicio de sesión ultra-minimalista, limpia y enfocada.
 * Credenciales por defecto: admin / admin.
 */

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { ShieldCheck, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, loginAsDemoAdmin, loginAsDemoCompanion, error, clearError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'COMPANION'>('ADMIN');
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRoleSelect = (role: 'ADMIN' | 'COMPANION') => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setUsername('admin');
      setPassword('admin');
    } else {
      setUsername('guia');
      setPassword('guia');
    }
    clearError();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(username, password);
      setIsLoading(false);
    }, 150);
  };

  const handleQuickDemoAdmin = () => {
    setUsername('admin');
    setPassword('admin');
    setSelectedRole('ADMIN');
    setIsLoading(true);
    setTimeout(() => {
      loginAsDemoAdmin();
      setIsLoading(false);
    }, 150);
  };

  const handleQuickDemoCompanion = () => {
    setUsername('guia');
    setPassword('guia');
    setSelectedRole('COMPANION');
    setIsLoading(true);
    setTimeout(() => {
      loginAsDemoCompanion();
      setIsLoading(false);
    }, 150);
  };

  return (
    <div className="min-h-screen w-screen bg-zinc-50 flex flex-col justify-center items-center p-4 selection:bg-zinc-900 selection:text-white font-sans">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6 sm:p-8 relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-lg mb-3 shadow-sm ring-1 ring-black/5">
            MT
          </div>
          <h1 className="text-lg font-bold text-zinc-950 tracking-tight">
            Medical Trip Colombia
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Gestión Operativa & Liquidación Financiera en Terreno
          </p>
          <span className="sr-only">Gestión de Itinerarios Clínicos & Liquidación Financiera</span>
        </div>

        {/* Role Selector Tabs */}
        <div className="mb-5 p-1 bg-zinc-100 rounded-xl grid grid-cols-2 gap-1 border border-zinc-200/60">
          <button
            type="button"
            onClick={() => handleRoleSelect('ADMIN')}
            data-testid="role-tab-admin"
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'ADMIN'
                ? 'bg-white text-zinc-950 shadow-2xs border border-zinc-200/70'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
            <span>Administrador</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('COMPANION')}
            data-testid="role-tab-companion"
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'COMPANION'
                ? 'bg-white text-amber-950 shadow-2xs border border-amber-200/70'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Acompañante Físico</span>
          </button>
        </div>

        {/* Role Scope Description Banner */}
        <div className="mb-5 p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs">
          {selectedRole === 'ADMIN' ? (
            <div className="space-y-0.5">
              <span className="font-bold text-zinc-900 block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-900" />
                Rol Administrador (Crea todo desde 0)
              </span>
              <p className="text-zinc-600 text-[11px] leading-relaxed">
                Alta y creación de pacientes, coordinación de servicios médicos, enlaces de autogestión WhatsApp y cierre contable global.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <span className="font-bold text-amber-900 block flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-amber-700" />
                Rol Acompañante Físico (Acompaña en terreno)
              </span>
              <p className="text-zinc-600 text-[11px] leading-relaxed">
                Acompañamiento presencial con el paciente, registro de turnos y horas, control de caja menor/viáticos y firma digital de conformidad.
              </p>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between animate-shake">
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="text-red-900 font-bold ml-2 hover:opacity-75"
            >
              ✕
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5" htmlFor="username">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedRole === 'ADMIN' ? 'admin' : 'guia'}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <span>{isLoading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-zinc-400 uppercase tracking-wider font-semibold font-mono">
              Acceso Rápido por Rol
            </span>
          </div>
        </div>

        {/* 1-Click Quick Demo Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleQuickDemoAdmin}
            className="w-full py-2.5 px-4 bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200 text-zinc-850 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] min-h-[42px]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
            <span>Entrar con Credenciales Demo (<span className="font-mono font-bold">admin / admin</span>)</span>
          </button>

          <button
            type="button"
            onClick={handleQuickDemoCompanion}
            data-testid="btn-demo-companion"
            className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] min-h-[42px]"
          >
            <UserIcon className="w-3.5 h-3.5 text-amber-700" />
            <span>Entrar como Acompañante Físico (<span className="font-mono font-bold">guia / guia</span>)</span>
          </button>
        </div>

        {/* Security & Offline Badge */}
        <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Control de Acceso RBAC • Operación 100% Offline</span>
        </div>
      </div>

      {/* Patient Referral Link */}
      <div className="mt-4 text-center">
        <a
          href="/portal-paciente"
          data-testid="link-patient-portal"
          onClick={(e) => {
            e.preventDefault();
            if (typeof window !== 'undefined' && window.history) {
              window.history.pushState({}, '', '/portal-paciente');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
          className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-4 transition-colors cursor-pointer"
        >
          ¿Eres paciente? Consulta tu itinerario aquí
        </a>
      </div>

      {/* Footer Info */}
      <footer className="mt-3 text-center text-xs text-zinc-400 font-mono">
        Medical Trip Colombia S.A.S. • Versión Operativa 2.0
      </footer>
    </div>
  );
};
