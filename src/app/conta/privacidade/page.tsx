"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { usePreferences } from "@/contexts";
import {
  DiscreteModeSection,
  AutoLockSection,
  ChangePasswordSection,
  DeleteAccountSection,
  VerifyPasswordModal,
} from "@/components/privacy";

export default function PrivacidadePage() {
  const router = useRouter();
  const { privacy, updatePrivacy, isLoading, isSaving } = usePreferences();

  // Session unlock state - allows toggling hide values without password after first verification
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [showVerifyPasswordModal, setShowVerifyPasswordModal] = useState(false);

  // Handle hide values toggle - requires password when disabling (only on first time per session)
  const handleHideValuesToggle = () => {
    if (privacy.hideValues) {
      // Disabling hide values
      if (sessionUnlocked) {
        // Already verified password this session - no need to ask again
        updatePrivacy({ hideValues: false });
      } else {
        // First time this session - require password confirmation
        setShowVerifyPasswordModal(true);
      }
    } else {
      // Enabling hide values - no password required
      updatePrivacy({ hideValues: true });
    }
  };

  const handlePasswordVerified = () => {
    setSessionUnlocked(true);
    updatePrivacy({ hideValues: false });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        <button
          onClick={() => router.push("/conta")}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Privacidade
            </h1>
            <p className="text-[var(--text-dimmed)] mt-1">
              Controle sua privacidade e segurança
            </p>
          </div>
          {isSaving && (
            <span className="text-sm text-[var(--text-muted)] animate-pulse">Salvando...</span>
          )}
        </div>

        <div className="space-y-6">
          {/* Modo Discreto */}
          <DiscreteModeSection
            enabled={privacy.hideValues}
            onToggle={handleHideValuesToggle}
          />

          {/* Bloqueio Automático */}
          <AutoLockSection
            enabled={privacy.autoLock}
            lockTime={privacy.autoLockTime}
            onToggle={() => updatePrivacy({ autoLock: !privacy.autoLock })}
            onTimeChange={(minutes) => updatePrivacy({ autoLockTime: minutes })}
          />

          {/* Alterar Senha */}
          <ChangePasswordSection />

          {/* Excluir Conta */}
          <DeleteAccountSection />
        </div>
      </div>

      {/* Modal de verificação de senha para desativar modo discreto */}
      <VerifyPasswordModal
        open={showVerifyPasswordModal}
        onClose={() => setShowVerifyPasswordModal(false)}
        onVerified={handlePasswordVerified}
      />
    </div>
  );
}
