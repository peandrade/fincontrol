"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sparkles,
  Wrench,
  AlertTriangle,
  Info,
  MessageSquare,
  RefreshCw,
  CheckCheck,
  ArrowLeft,
  X,
} from "lucide-react";
import type { Notification } from "@/hooks/use-notifications";

const typeConfig = {
  feature: {
    icon: Sparkles,
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
    label: "Nova funcionalidade",
  },
  fix: {
    icon: Wrench,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    label: "Correção",
  },
  alert: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    label: "Alerta",
  },
  info: {
    icon: Info,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    label: "Informação",
  },
  feedback_response: {
    icon: MessageSquare,
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
    label: "Resposta",
  },
  feedback_status: {
    icon: RefreshCw,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    label: "Status",
  },
};

interface NotificationPanelProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (ids: string[]) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export function NotificationPanel({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationPanelProps) {
  const hasUnread = notifications.some((n) => !n.isRead);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead([notification.id]);
    }
    setSelectedNotification(notification);
  };

  const handleBack = () => {
    setSelectedNotification(null);
  };

  // Detail view
  if (selectedNotification) {
    const config = typeConfig[selectedNotification.type];
    const Icon = config.icon;

    return (
      <div
        className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl overflow-hidden shadow-xl z-50"
        style={{
          backgroundColor: "var(--card-bg)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-[var(--border-color)]">
          <button
            onClick={handleBack}
            className="p-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Voltar
          </span>
          <div className="ml-auto">
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Detail content */}
        <div className="p-4 bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl ${config.bgColor}`}
            >
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                {config.label}
              </span>
              <p className="text-xs text-[var(--text-dimmed)] mt-0.5">
                {formatDistanceToNow(new Date(selectedNotification.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            {selectedNotification.title}
          </h4>

          <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
            {selectedNotification.message}
          </p>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl overflow-hidden shadow-xl z-50"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          Notificações
        </h3>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas como lidas
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-color mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Info className="w-8 h-8 text-[var(--text-dimmed)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">
              Nenhuma notificação
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {notifications.map((notification) => {
              const config = typeConfig[notification.type];
              const Icon = config.icon;

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full text-left p-4 bg-[var(--bg-secondary)]"
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg ${config.bgColor}`}
                    >
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[var(--text-dimmed)] mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
