"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";

interface VerifyPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function VerifyPasswordModal({ open, onClose, onVerified }: VerifyPasswordModalProps) {
  const t = useTranslations("privacy");
  const tc = useTranslations("common");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleVerify = async () => {
    if (!password) {
      setError(t("enterYourPassword"));
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("passwordVerifyError"));
        return;
      }

      if (data.valid) {
        onVerified();
        handleClose();
      } else {
        setError(t("wrongPassword"));
      }
    } catch {
      setError(t("passwordVerifyGenericError"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    setShowPassword(false);
    onClose();
  };

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-violet-500/10">
              <Lock className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <ModalTitle>{t("confirmPasswordTitle")}</ModalTitle>
              <ModalDescription>
                {t("confirmPasswordDesc")}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-red-500 text-sm">{error}</span>
            </div>
          )}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("enterYourPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              autoFocus
              className="w-full p-4 pr-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:opacity-80"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={handleClose}
            disabled={isVerifying}
            className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
          >
            {tc("cancel")}
          </button>
          <button
            onClick={handleVerify}
            disabled={isVerifying || !password}
            className="px-4 py-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("verifying")}
              </>
            ) : (
              tc("confirm")
            )}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
