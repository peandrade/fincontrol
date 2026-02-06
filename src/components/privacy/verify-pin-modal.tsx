"use client";

import { useState } from "react";
import { KeyRound, AlertCircle, Loader2 } from "lucide-react";
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

interface VerifyPinModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function VerifyPinModal({ open, onClose, onVerified }: VerifyPinModalProps) {
  const t = useTranslations("privacy");
  const tc = useTranslations("common");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePinChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
    setError("");

    // Auto-submit when 6 digits entered
    if (digits.length === 6) {
      handleVerify(digits);
    }
  };

  const handleVerify = async (pinToVerify?: string) => {
    const pinValue = pinToVerify || pin;
    if (pinValue.length !== 6) {
      setError(t("enterPinDigits"));
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/user/discrete-pin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("pinVerifyError"));
        setPin("");
        return;
      }

      if (data.valid) {
        onVerified();
        handleClose();
      } else {
        setError(t("wrongPin"));
        setPin("");
      }
    } catch {
      setError(t("pinVerifyGenericError"));
      setPin("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setError("");
    onClose();
  };

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-violet-500/10">
              <KeyRound className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <ModalTitle>{t("enterYourPin")}</ModalTitle>
              <ModalDescription>
                {t("pinToDisableDiscrete")}
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

          <div className="space-y-4">
            {/* PIN display */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-mono transition-colors ${
                    i < pin.length
                      ? "border-violet-500 bg-violet-500/10 text-[var(--text-primary)]"
                      : "border-[var(--border-color)] text-[var(--text-dimmed)]"
                  }`}
                >
                  {pin[i] ? "•" : ""}
                </div>
              ))}
            </div>

            {/* Hidden input for keyboard */}
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              className="opacity-0 absolute -z-10"
              maxLength={6}
              disabled={isVerifying}
            />

            {/* Numeric keypad */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((key) => (
                <button
                  key={key?.toString() ?? "empty"}
                  type="button"
                  onClick={() => {
                    if (key === null || isVerifying) return;
                    if (key === "del") {
                      setPin((prev) => prev.slice(0, -1));
                      setError("");
                    } else {
                      handlePinChange(pin + key);
                    }
                  }}
                  disabled={key === null || isVerifying}
                  className={`h-12 rounded-lg text-lg font-medium transition-colors ${
                    key === null
                      ? "invisible"
                      : "bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-[var(--text-primary)] disabled:opacity-50"
                  }`}
                >
                  {key === "del" ? "⌫" : key}
                </button>
              ))}
            </div>

            {isVerifying && (
              <div className="flex items-center justify-center gap-2 text-[var(--text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{t("verifying")}</span>
              </div>
            )}
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
