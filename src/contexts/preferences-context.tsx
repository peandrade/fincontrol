"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

import type { DisplayCurrency } from "@/lib/utils";

export interface GeneralPreferences {
  defaultPage: string;
  defaultPeriod: string;
  defaultSort: string;
  confirmBeforeDelete: boolean;
  displayCurrency: DisplayCurrency;
  language: "pt" | "en" | "es";
}

export interface NotificationPreferences {
  budgetAlerts: boolean;
  budgetThreshold: number;
  billReminders: boolean;
  reminderDays: number;
  weeklyReport: boolean;
  monthlyReport: boolean;
  sounds: boolean;
  vibration: boolean;
}

export interface PrivacyPreferences {
  hideValues: boolean;
  autoLock: boolean;
  autoLockTime: number;
}

interface PreferencesContextType {
  general: GeneralPreferences;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  isLoading: boolean;
  isSaving: boolean;
  sessionUnlocked: boolean;
  hasPin: boolean;
  updateGeneral: (updated: Partial<GeneralPreferences>) => Promise<void>;
  updateNotifications: (updated: Partial<NotificationPreferences>) => Promise<void>;
  updatePrivacy: (updated: Partial<PrivacyPreferences>) => Promise<void>;
  setSessionUnlocked: (unlocked: boolean) => void;
  toggleHideValues: () => { needsPin: boolean; needsSetupPin: boolean };
  refreshPinStatus: () => Promise<void>;
}

const defaultGeneral: GeneralPreferences = {
  defaultPage: "dashboard",
  defaultPeriod: "month",
  defaultSort: "recent",
  confirmBeforeDelete: true,
  displayCurrency: "BRL",
  language: "pt",
};

const defaultNotifications: NotificationPreferences = {
  budgetAlerts: true,
  budgetThreshold: 80,
  billReminders: true,
  reminderDays: 3,
  weeklyReport: false,
  monthlyReport: true,
  sounds: true,
  vibration: true,
};

const defaultPrivacy: PrivacyPreferences = {
  hideValues: false,
  autoLock: false,
  autoLockTime: 5,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [general, setGeneral] = useState<GeneralPreferences>(defaultGeneral);
  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotifications);
  const [privacy, setPrivacy] = useState<PrivacyPreferences>(defaultPrivacy);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  const fetchPinStatus = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const response = await fetch("/api/user/discrete-pin");
      if (response.ok) {
        const data = await response.json();
        setHasPin(data.hasPin);
      }
    } catch (error) {
      console.error("Erro ao verificar status do PIN:", error);
    }
  }, [status]);

  const refreshPinStatus = useCallback(async () => {
    await fetchPinStatus();
  }, [fetchPinStatus]);

  const fetchPreferences = useCallback(async () => {
    if (status !== "authenticated") {
      setIsLoading(false);
      return;
    }

    try {
      const [prefsResponse] = await Promise.all([
        fetch("/api/user/preferences"),
        fetchPinStatus(),
      ]);

      if (prefsResponse.ok) {
        const data = await prefsResponse.json();
        setGeneral(data.general);
        setNotifications(data.notifications);
        setPrivacy(data.privacy);

        // Sync locale cookie with DB preference
        if (data.general.language) {
          const currentCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("locale="))
            ?.split("=")[1];

          if (currentCookie !== data.general.language) {
            document.cookie = `locale=${data.general.language};path=/;max-age=${365 * 24 * 60 * 60}`;
            window.location.reload();
            return;
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar preferências:", error);
    } finally {
      setIsLoading(false);
    }
  }, [status, fetchPinStatus]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updateGeneral = async (updated: Partial<GeneralPreferences>) => {
    const newGeneral = { ...general, ...updated };
    setGeneral(newGeneral);
    setIsSaving(true);
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ general: newGeneral }),
      });

      // If language changed, update cookie and reload to get new translations
      if (updated.language && updated.language !== general.language) {
        document.cookie = `locale=${updated.language};path=/;max-age=${365 * 24 * 60 * 60}`;
        window.location.reload();
        return;
      }
    } catch (error) {
      console.error("Erro ao salvar preferências gerais:", error);
      setGeneral(general);
    } finally {
      setIsSaving(false);
    }
  };

  const updateNotifications = async (updated: Partial<NotificationPreferences>) => {
    const newNotifications = { ...notifications, ...updated };
    setNotifications(newNotifications);
    setIsSaving(true);
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: newNotifications }),
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      setNotifications(notifications);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePrivacy = async (updated: Partial<PrivacyPreferences>) => {
    const newPrivacy = { ...privacy, ...updated };
    setPrivacy(newPrivacy);
    setIsSaving(true);
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacy: newPrivacy }),
      });
    } catch (error) {
      console.error("Erro ao salvar privacidade:", error);
      setPrivacy(privacy);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle hide values - returns what action is needed
  const toggleHideValues = useCallback(() => {
    if (privacy.hideValues) {
      // Trying to show values (disable hide mode)
      if (sessionUnlocked) {
        // Already verified this session - just toggle
        updatePrivacy({ hideValues: false });
        return { needsPin: false, needsSetupPin: false };
      } else if (hasPin) {
        // Has PIN configured - need to verify it
        return { needsPin: true, needsSetupPin: false };
      } else {
        // No PIN configured - need to set one up first
        return { needsPin: false, needsSetupPin: true };
      }
    } else {
      // Trying to hide values (enable hide mode)
      if (hasPin) {
        // Has PIN - just enable
        updatePrivacy({ hideValues: true });
        return { needsPin: false, needsSetupPin: false };
      } else {
        // No PIN - need to set one up first
        return { needsPin: false, needsSetupPin: true };
      }
    }
  }, [privacy.hideValues, sessionUnlocked, hasPin]);

  return (
    <PreferencesContext.Provider
      value={{
        general,
        notifications,
        privacy,
        isLoading,
        isSaving,
        sessionUnlocked,
        hasPin,
        updateGeneral,
        updateNotifications,
        updatePrivacy,
        setSessionUnlocked,
        toggleHideValues,
        refreshPinStatus,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
