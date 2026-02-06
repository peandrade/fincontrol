"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { usePreferences } from "@/contexts";
import {
  DiscreteModeSection,
  AutoLockSection,
  ChangePasswordSection,
  DeleteAccountSection,
  SetupPinModal,
  VerifyPinModal,
  PinManagementSection,
} from "@/components/privacy";

export default function PrivacidadePage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { privacy, updatePrivacy, isLoading, isSaving, toggleHideValues, setSessionUnlocked, hasPin, refreshPinStatus } = usePreferences();

  const [showSetupPinModal, setShowSetupPinModal] = useState(false);
  const [showVerifyPinModal, setShowVerifyPinModal] = useState(false);

  // Handle hide values toggle - requires PIN when disabling (only on first time per session)
  const handleHideValuesToggle = () => {
    const result = toggleHideValues();
    if (result.needsSetupPin) {
      setShowSetupPinModal(true);
    } else if (result.needsPin) {
      setShowVerifyPinModal(true);
    }
  };

  const handlePinSetupSuccess = async () => {
    await refreshPinStatus();
    updatePrivacy({ hideValues: true });
    setShowSetupPinModal(false);
  };

  const handlePinVerified = () => {
    setSessionUnlocked(true);
    updatePrivacy({ hideValues: false });
    setShowVerifyPinModal(false);
  };

  const handlePinDeleted = async () => {
    await refreshPinStatus();
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
          <span>{tc("back")}</span>
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {t("privacy")}
            </h1>
            <p className="text-[var(--text-dimmed)] mt-1">
              {t("privacyDesc")}
            </p>
          </div>
          {isSaving && (
            <span className="text-sm text-[var(--text-muted)] animate-pulse">{tc("saving")}</span>
          )}
        </div>

        <div className="space-y-6">
          {/* Modo Discreto */}
          <DiscreteModeSection
            enabled={privacy.hideValues}
            onToggle={handleHideValuesToggle}
          />

          {/* Gerenciamento de PIN */}
          <PinManagementSection
            hasPin={hasPin}
            onPinCreated={refreshPinStatus}
            onPinDeleted={handlePinDeleted}
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

      {/* Modal de configuração de PIN */}
      <SetupPinModal
        open={showSetupPinModal}
        onClose={() => setShowSetupPinModal(false)}
        onSuccess={handlePinSetupSuccess}
      />

      {/* Modal de verificação de PIN */}
      <VerifyPinModal
        open={showVerifyPinModal}
        onClose={() => setShowVerifyPinModal(false)}
        onVerified={handlePinVerified}
      />
    </div>
  );
}
