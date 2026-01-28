"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Plus,
  X,
  MoreVertical,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useTemplateStore } from "@/store/template-store";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TemplateModal } from "./template-modal";
import type { TransactionTemplate, TransactionType } from "@/types";

const HIDDEN = "•••••";

interface FabActionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: TransactionTemplate) => void;
}

export function FabActionPanel({
  isOpen,
  onClose,
  onUseTemplate,
}: FabActionPanelProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TransactionTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TransactionTemplate | null>(null);
  const [isTemplateSubmitting, setIsTemplateSubmitting] = useState(false);

  const { privacy } = usePreferences();
  const fmt = (v: number) => (privacy.hideValues ? HIDDEN : formatCurrency(v));

  const {
    templates,
    isLoading,
    fetchTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    getMostUsedTemplates,
  } = useTemplateStore();

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, fetchTemplates]);

  const handleUseTemplate = async (template: TransactionTemplate) => {
    try {
      await useTemplate(template.id);
      onUseTemplate(template);
    } catch (error) {
      console.error("Erro ao usar template:", error);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteTemplate(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Erro ao excluir template:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveTemplate = async (data: {
    name: string;
    description?: string;
    category: string;
    type: TransactionType;
    value?: number;
  }) => {
    setIsTemplateSubmitting(true);
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, data);
      } else {
        await addTemplate(data);
      }
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
    } finally {
      setIsTemplateSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const displayTemplates = getMostUsedTemplates(6);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Atalhos
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsTemplateModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-color hover:bg-primary-soft rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Novo
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-dimmed)]" />
              </button>
            </div>
          </div>

          {/* Template list */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {isLoading && templates.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-color border-t-transparent rounded-full animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-10 h-10 text-[var(--text-dimmed)] mx-auto mb-3" />
                <p className="text-[var(--text-muted)]">Nenhum atalho criado</p>
                <p className="text-sm text-[var(--text-dimmed)] mt-1">
                  Crie atalhos para suas transações frequentes
                </p>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsTemplateModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-color hover:bg-primary-soft rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Criar primeiro atalho
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {displayTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="relative group p-3 rounded-xl transition-all cursor-pointer bg-[var(--bg-hover)] hover:bg-[var(--bg-hover-strong)]"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            template.type === "income"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {template.type === "income" ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate text-[var(--text-primary)]">
                            {template.name}
                          </p>
                          <p className="text-xs truncate text-[var(--text-dimmed)]">
                            {template.category}
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === template.id ? null : template.id);
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all"
                        >
                          <MoreVertical className="w-4 h-4 text-[var(--text-dimmed)]" />
                        </button>

                        {menuOpen === template.id && (
                          <div className="absolute right-0 top-6 w-32 py-1 rounded-lg shadow-xl z-10 bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTemplate(template);
                                setIsTemplateModalOpen(true);
                                setMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                              Editar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(template);
                                setMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {template.value && (
                      <p
                        className={`mt-2 text-sm font-medium ${
                          template.type === "income" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {template.type === "income" ? "+" : "-"} {fmt(template.value)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        template={editingTemplate}
        isSubmitting={isTemplateSubmitting}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteTemplate}
        title="Excluir atalho"
        message={`Tem certeza que deseja excluir o atalho "${deleteConfirm?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={isDeleting}
      />
    </>
  );
}
