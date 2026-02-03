"use client";

import { useEffect, useState } from "react";
import { Zap, Plus, MoreVertical, Edit2, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useTemplateStore } from "@/store/template-store";
import { formatCurrency } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { TransactionTemplate, TransactionType } from "@/types";

interface TemplateSectionProps {
  onUseTemplate: (template: TransactionTemplate) => void;
  onEditTemplate: (template: TransactionTemplate) => void;
  onCreateTemplate: () => void;
}

export function TemplateSection({
  onUseTemplate,
  onEditTemplate,
  onCreateTemplate,
}: TemplateSectionProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TransactionTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    templates,
    isLoading,
    fetchTemplates,
    deleteTemplate,
    useTemplate,
    getMostUsedTemplates,
  } = useTemplateStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

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

  const displayTemplates = getMostUsedTemplates(6);

  if (isLoading && templates.length === 0) {
    return (
      <div
        className="backdrop-blur rounded-2xl p-6 transition-colors duration-300"
        style={{
          backgroundColor: "var(--card-bg)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Atalhos
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-color border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="backdrop-blur rounded-2xl p-6 transition-colors duration-300"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Atalhos
          </h3>
        </div>
        <button
          onClick={onCreateTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-color hover:bg-primary-soft rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8">
          <p style={{ color: "var(--text-dimmed)" }}>Nenhum atalho criado</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>
            Crie atalhos para suas transações frequentes
          </p>
          <button
            onClick={onCreateTemplate}
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
              className="relative group p-3 rounded-xl transition-all cursor-pointer"
              style={{ backgroundColor: "var(--bg-hover)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                setMenuOpen(null);
              }}
              onClick={() => handleUseTemplate(template)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
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
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {template.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-dimmed)" }}>
                      {template.category}
                    </p>
                  </div>
                </div>

                {/* Menu button */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === template.id ? null : template.id);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all"
                    aria-label="Abrir menu de opções"
                    aria-expanded={menuOpen === template.id}
                    aria-haspopup="menu"
                  >
                    <MoreVertical className="w-4 h-4 text-[var(--text-dimmed)]" aria-hidden="true" />
                  </button>

                  {menuOpen === template.id && (
                    <div
                      className="absolute right-0 top-6 w-32 py-1 rounded-lg shadow-xl z-10"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTemplate(template);
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

              {}
              {template.value && (
                <p
                  className={`mt-2 text-sm font-medium ${
                    template.type === "income" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {template.type === "income" ? "+" : "-"} {formatCurrency(template.value)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteTemplate}
        title="Excluir atalho"
        message={`Tem certeza que deseja excluir o atalho "${deleteConfirm?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={isDeleting}
      />
    </div>
  );
}
