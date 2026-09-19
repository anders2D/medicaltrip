/**
 * Medical Trip Colombia S.A.S. - SendPatientInvitationModal
 * Modal para que el coordinador genere y comparta en 1 clic un enlace exclusivo de autogestión
 * para el paciente, permitiendo que este registre a sus acompañantes y discrimine roles (Paciente vs Acompañante).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/presentation/state/AppContext';
import { CreatePatientInvitationUseCase } from '../../../application/use-cases/CreatePatientInvitationUseCase';
import { ServiceContainer } from '@/core/infrastructure/ServiceContainer';
import { PatientInvitation } from '../../../domain/entities/PatientInvitation';
import {
  Link2,
  Copy,
  Check,
  Send,
  ExternalLink,
  X,
  User,
  Globe2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export interface SendPatientInvitationModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onGenerated?: (invitation: PatientInvitation, url: string) => void;
}

export const SendPatientInvitationModal: React.FC<SendPatientInvitationModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onGenerated,
}) => {
  const context = useAppContext();
  const isOpen = propIsOpen !== undefined ? propIsOpen : context.isSendInvitationModalOpen;
  const onClose = propOnClose || context.closeSendInvitationModal;

  const [patientName, setPatientName] = useState('Catia Rodrigues');
  const [country, setCountry] = useState('Curazao');
  const [language, setLanguage] = useState('Papiamento');
  const [phone, setPhone] = useState('+5999 512 0000');
  const [estimatedArrivalDate, setEstimatedArrivalDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().slice(0, 10);
  });
  const [coordinatorNotes, setCoordinatorNotes] = useState('');

  const [generatedInvitation, setGeneratedInvitation] = useState<PatientInvitation>(() => {
    const year = new Date().getFullYear();
    const hex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const initInv = new PatientInvitation({
      id: 'inv-init',
      token: `INV-${year}-${hex}`,
      patientName: 'Catia Rodrigues',
      country: 'Curazao',
      language: 'Papiamento',
      status: 'PENDING',
    });
    return initInv;
  });

  const [generatedUrl, setGeneratedUrl] = useState<string>(() => {
    const baseUrl =
      typeof window !== 'undefined' && window.location
        ? `${window.location.origin}${window.location.pathname}`
        : 'https://medicaltripapp-nine.vercel.app';
    return generatedInvitation.buildShareableUrl(baseUrl);
  });

  const [whatsAppText, setWhatsAppText] = useState<string>(() => {
    const baseUrl =
      typeof window !== 'undefined' && window.location
        ? `${window.location.origin}${window.location.pathname}`
        : 'https://medicaltripapp-nine.vercel.app';
    return generatedInvitation.buildWhatsAppMessage(baseUrl);
  });

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const invitationRepository = useMemo(() => ServiceContainer.getInvitationRepository(), []);
  const useCase = useMemo(
    () => new CreatePatientInvitationUseCase(invitationRepository),
    [invitationRepository]
  );

  const handleGenerateLink = async () => {
    if (!patientName.trim()) {
      setError('Por favor ingresa el nombre del paciente.');
      return;
    }
    setError(null);
    setIsGenerating(true);

    try {
      const baseUrl =
        typeof window !== 'undefined' && window.location
          ? `${window.location.origin}${window.location.pathname}`
          : 'https://medicaltripapp-nine.vercel.app';

      const result = await useCase.execute({
        patientName: patientName.trim(),
        country,
        language,
        phone,
        estimatedArrivalDate,
        coordinatorNotes,
        baseUrl,
      });

      setGeneratedInvitation(result.invitation);
      setGeneratedUrl(result.shareableUrl);
      setWhatsAppText(result.whatsAppMessage);

      if (onGenerated) {
        onGenerated(result.invitation, result.shareableUrl);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al generar el enlace');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generar link inicial al abrir
  useEffect(() => {
    if (isOpen && !generatedUrl) {
      handleGenerateLink();
    }
  }, [isOpen]);

  const handleCopyLink = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    if (!generatedUrl) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedMsg = encodeURIComponent(whatsAppText);
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTestInNewTab = () => {
    if (!generatedUrl) return;
    window.open(generatedUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <Link2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                Enviar Link a Paciente
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Autogestión
                </span>
              </h2>
              <p className="text-xs text-zinc-500">
                El paciente registrará sus acompañantes y requerimientos de hotel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Nombre del Paciente */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-500" />
              Nombre del Paciente (Titular) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Ej. Catia Rodrigues"
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
              data-testid="input-invitation-patient-name"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Este nombre aparecerá preasignado al paciente al abrir el enlace.
            </p>
          </div>

          {/* País & Idioma */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-zinc-500" />
                País de Origen
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
              >
                <option value="Curazao">Curazao 🇨🇼</option>
                <option value="Aruba">Aruba 🇦🇼</option>
                <option value="Bonaire">Bonaire 🇧🇶</option>
                <option value="Países Bajos">Países Bajos 🇳🇱</option>
                <option value="Estados Unidos">Estados Unidos 🇺🇸</option>
                <option value="Panamá">Panamá 🇵🇦</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Idioma</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
              >
                <option value="Papiamento">Papiamento</option>
                <option value="Español">Español</option>
                <option value="English">English</option>
                <option value="Nederlands">Nederlands</option>
              </select>
            </div>
          </div>

          {/* Teléfono & Fecha Estimada */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                WhatsApp / Teléfono
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+5999 512 0000"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Fecha Estimada
              </label>
              <input
                type="date"
                value={estimatedArrivalDate}
                onChange={(e) => setEstimatedArrivalDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Notas para el Paciente (Opcional)
            </label>
            <input
              type="text"
              value={coordinatorNotes}
              onChange={(e) => setCoordinatorNotes(e.target.value)}
              placeholder="Ej. Cita prequirúrgica en Clofán / Consulta con especialista"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
            />
          </div>

          {/* Botón Actualizar Enlace si cambiaron datos */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerateLink}
              disabled={isGenerating}
              data-testid="btn-regenerate-link"
              className="text-xs font-medium text-zinc-700 hover:text-zinc-900 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {isGenerating ? 'Actualizando...' : 'Regenerar Enlace'}
            </button>
          </div>

          {/* Enlace Generado Box */}
          {generatedUrl && (
            <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Enlace de Autogestión Generado
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                  {generatedInvitation?.token}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedUrl}
                  className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-700 truncate select-all focus:outline-none"
                  data-testid="input-generated-link"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                    isCopied
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                  data-testid="btn-copy-invitation-link"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              {/* Botones de Acción Primaria */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all"
                  data-testid="btn-share-whatsapp"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar por WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleTestInNewTab}
                  className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  data-testid="btn-preview-form"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
                  Abrir Formulario
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>Persistencia desacoplada (LocalStorage / Listo para Supabase)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 font-medium hover:bg-zinc-200/60 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
