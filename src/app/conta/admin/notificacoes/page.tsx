"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import {
  ArrowLeft,
  Bell,
  Plus,
  Sparkles,
  Wrench,
  AlertTriangle,
  Info,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { usePreferences } from "@/contexts";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "feature" | "fix" | "alert" | "info";
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  readCount: number;
  readPercent: number;
}

const typeConfig = {
  feature: {
    icon: Sparkles,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    labelKey: "feature",
  },
  fix: {
    icon: Wrench,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    labelKey: "fix",
  },
  alert: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    labelKey: "alertType",
  },
  info: {
    icon: Info,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    labelKey: "infoType",
  },
};

const dateLocales = { pt: ptBR, en: enUS, es };

export default function AdminNotificacoesPage() {
  const router = useRouter();
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const { general } = usePreferences();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);

  const currentLocale = dateLocales[general.language as keyof typeof dateLocales] || ptBR;

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/admin");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleToggleActive = async (notification: Notification) => {
    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !notification.isActive }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Erro ao atualizar notificação:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteNotificationConfirm"))) return;

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(139, 92, 246, 0.2)" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button
          onClick={() => router.push("/conta/admin")}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tc("back")}</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-violet-500/10">
              <Bell className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                {t("title")}
              </h1>
              <p className="text-[var(--text-dimmed)] mt-1">
                {t("subtitle")}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            {t("newNotification")}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl"
            style={{
              backgroundColor: "var(--card-bg)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--border-color)",
            }}
          >
            <Bell className="w-12 h-12 text-[var(--text-dimmed)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">{t("noNotifications")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const config = typeConfig[notification.type];
              const Icon = config.icon;

              return (
                <div
                  key={notification.id}
                  className={`rounded-xl p-4 sm:p-5 transition-all ${
                    !notification.isActive ? "opacity-60" : ""
                  }`}
                  style={{
                    backgroundColor: "var(--card-bg)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 p-3 rounded-xl ${config.bgColor} h-fit`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-[var(--text-primary)]">
                              {notification.title}
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                              {t(config.labelKey)}
                            </span>
                            {!notification.isActive && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400">
                                {t("inactive")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleActive(notification)}
                            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                            title={notification.isActive ? t("deactivate") : t("activate")}
                          >
                            {notification.isActive ? (
                              <Eye className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingNotification(notification)}
                            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                            title={tc("edit")}
                          >
                            <Edit2 className="w-4 h-4 text-[var(--text-muted)]" />
                          </button>
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            title={tc("delete")}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-dimmed)]">
                        <span>
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: currentLocale,
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {notification.readCount} {t("readings")} ({notification.readPercent}%)
                        </span>
                        {notification.expiresAt && (
                          <span className="text-amber-400">
                            {t("expiresIn")}{" "}
                            {formatDistanceToNow(new Date(notification.expiresAt), {
                              locale: currentLocale,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingNotification) && (
        <NotificationModal
          notification={editingNotification}
          onClose={() => {
            setShowCreateModal(false);
            setEditingNotification(null);
          }}
          onSave={() => {
            fetchNotifications();
            setShowCreateModal(false);
            setEditingNotification(null);
          }}
        />
      )}
    </div>
  );
}

interface NotificationModalProps {
  notification: Notification | null;
  onClose: () => void;
  onSave: () => void;
}

function NotificationModal({ notification, onClose, onSave }: NotificationModalProps) {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const [title, setTitle] = useState(notification?.title || "");
  const [message, setMessage] = useState(notification?.message || "");
  const [type, setType] = useState<"feature" | "fix" | "alert" | "info">(
    notification?.type || "info"
  );
  const [expiresAt, setExpiresAt] = useState(
    notification?.expiresAt ? notification.expiresAt.split("T")[0] : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!notification;

  const typeShortLabels: Record<string, string> = {
    feature: t("feature").split(" ")[0],
    fix: t("fix"),
    alertType: t("alertType"),
    infoType: t("infoType").split(" ")[0] || t("infoType"),
  };

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      setError(tc("required"));
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/notifications/${notification.id}`
        : "/api/notifications/admin";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          type,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("saveError"));
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("unknownError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--card-bg)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {isEditing ? t("editNotification") : t("newNotification")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              {t("notificationTitle")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              maxLength={100}
              className="w-full p-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              {t("messageLabel")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
              maxLength={1000}
              rows={4}
              className="w-full p-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              {tc("type")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((typeKey) => {
                const config = typeConfig[typeKey];
                const Icon = config.icon;
                const isSelected = type === typeKey;

                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setType(typeKey)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? `${config.bgColor} border-current ${config.color}`
                        : "border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{typeShortLabels[config.labelKey]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              {t("expirationDate")}
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full p-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
          >
            {tc("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? tc("save") : tc("create")}
          </button>
        </div>
      </div>
    </div>
  );
}
