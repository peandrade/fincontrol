"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bug,
  Lightbulb,
  MessageCircle,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Filter,
  RefreshCw,
  Trash2,
  ExternalLink,
  Loader2,
  Bell,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { isAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";

interface FeedbackUser {
  id: string;
  name: string | null;
  email: string;
}

interface Feedback {
  id: string;
  type: "bug" | "suggestion" | "other";
  description: string;
  attachments: string[];
  status: "pending" | "reviewing" | "resolved" | "closed";
  adminResponse: string | null;
  respondedAt: string | null;
  userId: string;
  user: FeedbackUser;
  createdAt: string;
  updatedAt: string;
}

const typeConfig = {
  bug: { label: "Bug", icon: Bug, color: "text-red-400", bg: "bg-red-500/10" },
  suggestion: { label: "Sugestao", icon: Lightbulb, color: "text-amber-400", bg: "bg-amber-500/10" },
  other: { label: "Outro", icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-500/10" },
};

const statusConfig = {
  pending: { label: "Pendente", icon: Clock, color: "text-gray-400", bg: "bg-gray-500/10" },
  reviewing: { label: "Analisando", icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10" },
  resolved: { label: "Resolvido", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  closed: { label: "Fechado", icon: XCircle, color: "text-gray-500", bg: "bg-gray-500/10" },
};

export default function AdminFeedbackPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState<string>("");
  const [isSendingResponse, setIsSendingResponse] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("all", "true");
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("type", filterType);

      const response = await fetch(`/api/feedback/admin?${params}`);
      if (!response.ok) {
        if (response.status === 403) {
          router.push("/conta");
          return;
        }
        throw new Error("Erro ao carregar feedbacks");
      }

      const data = await response.json();
      setFeedbacks(data);
    } catch (err) {
      showError("Erro", err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterType, router, showError]);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!session?.user?.id || !isAdmin(session.user.id)) {
      router.push("/conta");
      return;
    }

    fetchFeedbacks();
  }, [session, sessionStatus, router, fetchFeedbacks]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }

      const updated = await response.json();
      setFeedbacks((prev) => prev.map((f) => (f.id === id ? updated : f)));
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(updated);
      }
      success("Status atualizado");
    } catch (err) {
      showError("Erro", err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este feedback?")) return;

    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir feedback");
      }

      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(null);
      }
      success("Feedback excluido");
    } catch (err) {
      showError("Erro", err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  const sendAdminResponse = async (id: string) => {
    if (!adminResponse.trim()) return;

    setIsSendingResponse(true);
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminResponse }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar resposta");
      }

      const updated = await response.json();
      setFeedbacks((prev) => prev.map((f) => (f.id === id ? updated : f)));
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(updated);
      }
      setAdminResponse("");
      success("Resposta enviada! O usuario sera notificado.");
    } catch (err) {
      showError("Erro", err instanceof Error ? err.message : "Erro ao enviar resposta");
    } finally {
      setIsSendingResponse(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/conta")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Admin - Feedbacks
            </h1>
            <p className="text-[var(--text-dimmed)] mt-1">
              Gerencie os feedbacks dos usuarios
            </p>
          </div>
          <button
            onClick={() => router.push("/conta/admin/notificacoes")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificacoes</span>
          </button>
          <Button variant="secondary" size="sm" onClick={fetchFeedbacks}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--text-dimmed)]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 pr-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] appearance-none bg-no-repeat bg-[length:16px] bg-[right_8px_center]"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")" }}
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="reviewing">Analisando</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
            </select>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 pr-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] appearance-none bg-no-repeat bg-[length:16px] bg-[right_8px_center]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")" }}
          >
            <option value="">Todos os tipos</option>
            <option value="bug">Bug</option>
            <option value="suggestion">Sugestao</option>
            <option value="other">Outro</option>
          </select>
          <div className="ml-auto text-sm text-[var(--text-dimmed)]">
            {feedbacks.length} feedback{feedbacks.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-3">
            {feedbacks.length === 0 ? (
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-8 text-center">
                <MessageCircle className="w-12 h-12 text-[var(--text-dimmed)] mx-auto mb-3" />
                <p className="text-[var(--text-muted)]">Nenhum feedback encontrado</p>
              </div>
            ) : (
              feedbacks.map((feedback) => {
                const type = typeConfig[feedback.type];
                const status = statusConfig[feedback.status];
                const TypeIcon = type.icon;
                const StatusIcon = status.icon;

                return (
                  <button
                    key={feedback.id}
                    onClick={() => setSelectedFeedback(feedback)}
                    className={cn(
                      "w-full bg-[var(--bg-secondary)] rounded-xl border p-4 text-left transition-all hover:bg-[var(--bg-hover)]",
                      selectedFeedback?.id === feedback.id
                        ? "border-[var(--color-primary)]"
                        : "border-[var(--border-color)]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", type.bg)}>
                        <TypeIcon className={cn("w-4 h-4", type.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[var(--text-primary)] truncate">
                            {feedback.user.name || feedback.user.email}
                          </span>
                          <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs", status.bg)}>
                            <StatusIcon className={cn("w-3 h-3", status.color)} />
                            <span className={status.color}>{status.label}</span>
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] line-clamp-2">
                          {feedback.description}
                        </p>
                        <p className="text-xs text-[var(--text-dimmed)] mt-2">
                          {formatDate(feedback.createdAt)}
                        </p>
                      </div>
                      {feedback.attachments.length > 0 && (
                        <span className="text-xs text-[var(--text-dimmed)]">
                          {feedback.attachments.length} anexo{feedback.attachments.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Detail */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {selectedFeedback ? (
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                {/* Detail Header */}
                <div className="p-4 border-b border-[var(--border-color)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const type = typeConfig[selectedFeedback.type];
                        const TypeIcon = type.icon;
                        return (
                          <>
                            <div className={cn("p-2 rounded-lg", type.bg)}>
                              <TypeIcon className={cn("w-4 h-4", type.color)} />
                            </div>
                            <span className="font-medium text-[var(--text-primary)]">{type.label}</span>
                          </>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() => deleteFeedback(selectedFeedback.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                      title="Excluir feedback"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-[var(--border-color)]">
                  <p className="text-sm text-[var(--text-dimmed)] mb-1">Usuario</p>
                  <p className="font-medium text-[var(--text-primary)]">
                    {selectedFeedback.user.name || "Sem nome"}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">{selectedFeedback.user.email}</p>
                  <p className="text-xs text-[var(--text-dimmed)] mt-2">
                    Enviado em {formatDate(selectedFeedback.createdAt)}
                  </p>
                </div>

                {/* Status Update */}
                <div className="p-4 border-b border-[var(--border-color)]">
                  <p className="text-sm text-[var(--text-dimmed)] mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((key) => {
                      const config = statusConfig[key];
                      const Icon = config.icon;
                      const isActive = selectedFeedback.status === key;
                      const isUpdating = updatingId === selectedFeedback.id;

                      return (
                        <button
                          key={key}
                          onClick={() => updateStatus(selectedFeedback.id, key)}
                          disabled={isActive || isUpdating}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                            isActive
                              ? `${config.bg} ${config.color} cursor-default`
                              : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10"
                          )}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" />
                          )}
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 border-b border-[var(--border-color)]">
                  <p className="text-sm text-[var(--text-dimmed)] mb-2">Descricao</p>
                  <p className="text-[var(--text-primary)] whitespace-pre-wrap">
                    {selectedFeedback.description}
                  </p>
                </div>

                {/* Previous Admin Response */}
                {selectedFeedback.adminResponse && (
                  <div className="p-4 border-b border-[var(--border-color)] bg-violet-500/5">
                    <p className="text-sm text-[var(--text-dimmed)] mb-2">Resposta do Admin</p>
                    <p className="text-[var(--text-primary)] whitespace-pre-wrap">
                      {selectedFeedback.adminResponse}
                    </p>
                    {selectedFeedback.respondedAt && (
                      <p className="text-xs text-[var(--text-dimmed)] mt-2">
                        Respondido em {formatDate(selectedFeedback.respondedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Admin Response Input */}
                <div className="p-4 border-b border-[var(--border-color)]">
                  <p className="text-sm text-[var(--text-dimmed)] mb-2">
                    {selectedFeedback.adminResponse ? "Nova resposta" : "Responder ao usuario"}
                  </p>
                  <div className="flex gap-2">
                    <textarea
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="Digite sua resposta..."
                      rows={3}
                      className="flex-1 p-3 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] resize-none focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => sendAdminResponse(selectedFeedback.id)}
                      disabled={!adminResponse.trim() || isSendingResponse}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingResponse ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Enviar resposta
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-dimmed)] mt-2">
                    O usuario sera notificado quando voce enviar a resposta.
                  </p>
                </div>

                {/* Attachments */}
                {selectedFeedback.attachments.length > 0 && (
                  <div className="p-4">
                    <p className="text-sm text-[var(--text-dimmed)] mb-2">Anexos</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedFeedback.attachments.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group"
                        >
                          <img
                            src={url}
                            alt={`Anexo ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg border border-[var(--border-color)]"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-8 text-center">
                <Eye className="w-12 h-12 text-[var(--text-dimmed)] mx-auto mb-3" />
                <p className="text-[var(--text-muted)]">Selecione um feedback para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
