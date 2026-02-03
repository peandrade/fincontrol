"use client";

import { useState, useEffect } from "react";
import { Tags, Plus, RefreshCw } from "lucide-react";
import { useCategoryStore, type Category, type CreateCategoryInput, type UpdateCategoryInput } from "@/store/category-store";
import { CategoryModal, CategoryList } from "@/components/categories";

export function CategorySection() {
  const {
    isLoading,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getExpenseCategories,
    getIncomeCategories,
  } = useCategoryStore();

  const [categoryTab, setCategoryTab] = useState<"expense" | "income">("expense");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenModal = (category?: Category) => {
    setEditingCategory(category || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    setIsSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data as UpdateCategoryInput);
      } else {
        await addCategory(data as CreateCategoryInput);
      }
      handleCloseModal();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    setIsDeleting(true);
    try {
      await deleteCategory(category.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayedCategories = categoryTab === "expense" ? getExpenseCategories() : getIncomeCategories();

  return (
    <>
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Tags className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Categorias Personalizadas
                </h3>
                <p className="text-sm text-[var(--text-dimmed)]">
                  Crie e gerencie suas categorias
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25"
            >
              <Plus className="w-4 h-4" />
              Nova
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCategoryTab("expense")}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                categoryTab === "expense"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => setCategoryTab("income")}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                categoryTab === "income"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
              }`}
            >
              Receitas
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 text-primary-color animate-spin mx-auto mb-2" />
              <p className="text-[var(--text-dimmed)]">Carregando categorias...</p>
            </div>
          ) : (
            <CategoryList
              categories={displayedCategories}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          )}
        </div>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        isSubmitting={isSaving}
        category={editingCategory}
      />
    </>
  );
}
