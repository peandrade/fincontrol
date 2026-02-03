"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

export interface GeneralPreferences {
  defaultPage: string;
  defaultPeriod: string;
  defaultSort: string;
  confirmBeforeDelete: boolean;
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
  updateGeneral: (updated: Partial<GeneralPreferences>) => Promise<void>;
  updateNotifications: (updated: Partial<NotificationPreferences>) => Promise<void>;
  updatePrivacy: (updated: Partial<PrivacyPreferences>) => Promise<void>;
}

const defaultGeneral: GeneralPreferences = {
  defaultPage: "dashboard",
  defaultPeriod: "month",
  defaultSort: "recent",
  confirmBeforeDelete: true,
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

  const fetchPreferences = useCallback(async () => {
    if (status !== "authenticated") {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/preferences");
      if (response.ok) {
        const data = await response.json();
        setGeneral(data.general);
        setNotifications(data.notifications);
        setPrivacy(data.privacy);
      }
    } catch (error) {
      console.error("Erro ao buscar preferências:", error);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

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

  return (
    <PreferencesContext.Provider
      value={{
        general,
        notifications,
        privacy,
        isLoading,
        isSaving,
        updateGeneral,
        updateNotifications,
        updatePrivacy,
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
