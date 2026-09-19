/**
 * Medical Trip Colombia S.A.S. - WelcomeOrientationModal
 * Modal dialog presenting the Comprehensive Welcome & Caribbean Orientation Kit:
 * - 24/7 Emergency Contacts
 * - Local Claro 80GB SIM Card Delivery Status
 * - Currency Exchange Guidance & Authorized Exchange Houses
 * - Fasting & Clinical Preparation Instructions
 */

import React from 'react';
import { Modal } from '@/core/ui/Modal';
import { OrientationKitPreview } from './OrientationKitPreview';
import { useLanguage } from '@/core/i18n';
import { Compass } from 'lucide-react';

export interface WelcomeOrientationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeOrientationModal: React.FC<WelcomeOrientationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`🌴 ${t.arrivalLogistics.welcomeKitTitle}`}
      subtitle="Medical Trip Colombia S.A.S. • Protocolo de Llegada & Handoff Operativo"
      footer={
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium">
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            <span>Medellín & Oriente Antioqueño</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-modal-close-orientation"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 active:scale-95 duration-200 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[44px]"
          >
            {t.common.close}
          </button>
        </div>
      }
    >
      <div data-testid="welcome-orientation-modal-content">
        <OrientationKitPreview onClose={onClose} />
      </div>
    </Modal>
  );
};
