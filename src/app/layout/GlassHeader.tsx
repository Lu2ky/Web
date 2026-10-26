import React, { useState } from 'react';
import logo from '@/shared/assets/logo.png';
import { GlassToolbar, GlassButton, GlassModal } from '@/shared/ui/glass';
import DropdownAcount from '@/features/profile/ui/DropdownAcount';
import NotificationBell from '@/features/notifications/ui/NotificationBell';
import '@/shared/styles/liquidGlass.css';
import '@/shared/styles/glassComponents.css';

interface GlassHeaderProps {
  userId: string | number;
  variant?: 'student' | 'admin';
}

export function GlassHeader({ userId, variant = 'student' }: GlassHeaderProps) {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const isAdminHeader = variant === 'admin';

  const openInstructions = () => setIsInstructionsOpen(true);
  const closeInstructions = () => setIsInstructionsOpen(false);

  return (
    <>
      <GlassToolbar
        scrollEdge
        left={
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo de UPB Planner" className="h-10 w-auto" />
            <h1 className="text-headline font-semibold glass-text-primary hidden sm:block">
              UPB Planner
            </h1>
            <h1 className="text-title font-semibold glass-text-primary sm:hidden">
              UPB Planner
            </h1>
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            {!isAdminHeader && (
              <NotificationBell userId={userId} />
            )}
            {!isAdminHeader && (
              <GlassButton
                variant="ghost"
                size="sm"
                iconOnly
                onClick={openInstructions}
                aria-label="Abrir instrucciones para quejas o preguntas"
                aria-expanded={isInstructionsOpen}
                aria-controls="header-help-modal-content"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </GlassButton>
            )}
            <DropdownAcount userId={userId} showPreferences={!isAdminHeader} />
          </div>
        }
      />

      {!isAdminHeader ? (
        <GlassModal
          isOpen={isInstructionsOpen}
          onClose={() => setIsInstructionsOpen(false)}
          title="Instrucciones para quejas y preguntas"
          size="md"
          closeLabel="Entendido"
          closeOnOverlayClick
        >
          <div className="helpInstructionsContent glass-text-secondary" id="header-help-modal-content">
            <p>
              Si tienes una queja o una pregunta, usa este flujo para recibir atención más rápida:
            </p>
            <ol className="list-decimal list-inside space-y-2 my-4">
              <li>Describe el problema o la duda de forma corta y clara.</li>
              <li>Indica la fecha y hora aproximada en la que ocurrió.</li>
              <li>Anexa evidencia (captura de pantalla, mensaje de error o contexto).</li>
              <li>Incluye tus datos de contacto y el canal preferido para respuesta.</li>
            </ol>
            <p>
              Con esta información, el equipo puede escalar y responder tu caso con mayor precisión.
            </p>
            <p>
              Correo de contacto: <a href="mailto:upbplanner@gmail.com" className="glass-text-primary underline">upbplanner@gmail.com</a>
            </p>
          </div>
        </GlassModal>
      ) : null}
    </>
  );
}

export default GlassHeader;