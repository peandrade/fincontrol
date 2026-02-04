"use client";

import { useState, useEffect, useCallback } from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "feature" | "fix" | "alert" | "info" | "feedback_response" | "feedback_status";
  metadata?: Record<string, unknown>;
  createdAt: string;
  isRead: boolean;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/notifications");

      if (!response.ok) {
        throw new Error("Erro ao buscar notificações");
      }

      const data: NotificationsResponse = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error("Erro ao marcar como lida");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      if (!response.ok) {
        throw new Error("Erro ao marcar todas como lidas");
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
