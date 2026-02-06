"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
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

interface SetupPinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SetupPinModal({ open, onClose, onSuccess }: SetupPinModalProps) {
  const t = useTranslations("privacy");
  const tc = useTranslations("common");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"pin" | "confirm" | "password">("pin");

  const handlePinChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, "").slice(0, 6);
    if (step === "pin") {
      setPin(digits);
      if (digits.length === 6) {
        setTimeout(() => setStep("confirm"), 200);
      }
    } else if (step === "confirm") {
      setConfirmPin(digits);
      if (digits.length === 6) {
        if (digits !== pin) {
          setError(t("pinsDontMatch"));
          setConfirmPin("");
        } else {
          setError("");
          setTimeout(() => setStep("password"), 200);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!accountPassword) {
      setError(t("confirmAccountPassword"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/user/discrete-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, accountPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("pinCreateError"));
        return;
      }

      onSuccess();
      handleClose();
    } catch {
      setError(t("pinCreateGenericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setConfirmPin("");
    setAccountPassword("");
    setError("");
    setShowPassword(false);
    setStep("pin");
    onClose();
  };

  const handleBack = () => {
    setError("");
    if (step === "confirm") {
      setConfirmPin("");
      setStep("pin");
    } else if (step === "password") {
      setAccountPassword("");
      setStep("confirm");
    }
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
              <ModalTitle>{t("createPinTitle")}</ModalTitle>
              <ModalDescription>
                {step === "pin" && t("enterPin")}
                {step === "confirm" && t("confirmPin")}
                {step === "password" && t("confirmWithPassword")}
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

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {["pin", "confirm", "password"].map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step === s
                    ? "bg-violet-500"
                    : i < ["pin", "confirm", "password"].indexOf(step)
                    ? "bg-violet-500/50"
                    : "bg-[var(--border-color)]"
                }`}
              />
            ))}
          </div>

          {(step === "pin" || step === "confirm") && (
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const currentValue = step === "pin" ? pin : confirmPin;
                  return (
                    <div
                      key={i}
                      className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-mono transition-colors ${
                        i < currentValue.length
                          ? "border-violet-500 bg-violet-500/10 text-[var(--text-primary)]"
                          : "border-[var(--border-color)] text-[var(--text-dimmed)]"
                      }`}
                    >
                      {currentValue[i] ? "•" : ""}
                    </div>
                  );
                })}
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                value={step === "pin" ? pin : confirmPin}
                onChange={(e) => handlePinChange(e.target.value)}
                className="opacity-0 absolute -z-10"
                maxLength={6}
              />
              {/* Numeric keypad for mobile */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((key) => (
                  <button
                    key={key?.toString() ?? "empty"}
                    type="button"
                    onClick={() => {
                      if (key === null) return;
                      if (key === "del") {
                        if (step === "pin") {
                          setPin((prev) => prev.slice(0, -1));
                        } else {
                          setConfirmPin((prev) => prev.slice(0, -1));
                        }
                      } else {
                        handlePinChange((step === "pin" ? pin : confirmPin) + key);
                      }
                    }}
                    disabled={key === null}
                    className={`h-12 rounded-lg text-lg font-medium transition-colors ${
                      key === null
                        ? "invisible"
                        : "bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-[var(--text-primary)]"
                    }`}
                  >
                    {key === "del" ? "⌫" : key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "password" && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("accountPassword")}
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
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
          )}
        </ModalBody>
        <ModalFooter>
          {step !== "pin" && (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
            >
              {tc("back")}
            </button>
          )}
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
          >
            {tc("cancel")}
          </button>
          {step === "password" && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !accountPassword}
              className="px-4 py-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("creating")}
                </>
              ) : (
                t("createPinButton")
              )}
            </button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
