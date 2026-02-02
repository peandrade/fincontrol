"use client";

import { useState } from "react";
import { Pencil, Trash2, Lock } from "lucide-react";
import { usePreferences } from "@/contexts";
import { DynamicIcon } from "./icon-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Category } from "@/store/category-store";

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => Promise<void>;
  isDeleting?: boolean;
}

export function CategoryList({
  categories,
  onEdit,
  onDelete,
  isDeleting,
}: CategoryListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const { general } = usePreferences();

  const handleDeleteClick = (category: Category) => {
    if (!general.confirmBeforeDelete) {
      onDelete(category);
      return;
    }
    setDeleteConfirm(category);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      await onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--text-dimmed)]">Nenhuma categoria encontrada</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-hover-strong)] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <DynamicIcon
                  name={category.icon}
                  className="w-5 h-5"
                  style={{ color: category.color }}
                />
              </div>
              <div>
                <span className="text-[var(--text-primary)] font-medium">
                  {category.name}
                </span>
                {category.isDefault && (
                  <span className="ml-2 text-xs text-[var(--text-dimmed)] flex items-center gap-1 inline-flex">
                    <Lock className="w-3 h-3" />
                    Padrão
                  </span>
                )}
              </div>
            </div>

            {!category.isDefault && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(category)}
                  className="p-2 hover:bg-primary-medium rounded-lg transition-colors"
                  title="Editar"
                  aria-label={`Editar categoria ${category.name}`}
                >
                  <Pencil className="w-4 h-4 text-primary-color" aria-hidden="true" />
                </button>
                <button
                  onClick={() => handleDeleteClick(category)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Excluir"
                  aria-label={`Excluir categoria ${category.name}`}
                >
                  <Trash2 className="w-4 h-4 text-red-400" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir categoria"
        message={`Tem certeza que deseja excluir a categoria "${deleteConfirm?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={isDeleting}
      />
    </>
  );
}
