"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Calendar,
  Shield,
  Tags,
  Plus,
} from "lucide-react";
import { useCategoryStore, type Category, type CreateCategoryInput, type UpdateCategoryInput } from "@/store/category-store";
import { CategoryModal, CategoryList } from "@/components/categories";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
}

export default function PerfilPage() {
  const { update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Categories
  const {
    isLoading: isCategoriesLoading,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getExpenseCategories,
    getIncomeCategories,
  } = useCategoryStore();
  const [categoryTab, setCategoryTab] = useState<"expense" | "income">("expense");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabels = ["Muito fraca", "Fraca", "Média", "Forte", "Muito forte"];
  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  useEffect(() => {
    fetchProfile();
    fetchCategories();
  }, [fetchCategories]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setName(data.name || "");
        setEmail(data.email || "");
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setIsUpdatingProfile(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar perfil");
      }

      setProfile(data);
      setProfileMessage({ type: "success", text: "Perfil atualizado com sucesso!" });

      // Atualiza a sessão
      await updateSession({ name: data.name });
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao atualizar perfil",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "As senhas não coincidem" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "A nova senha deve ter no mínimo 6 caracteres",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao alterar senha");
      }

      setPasswordMessage({ type: "success", text: "Senha alterada com sucesso!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao alterar senha",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Category handlers
  const handleOpenCategoryModal = (category?: Category) => {
    setEditingCategory(category || null);
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data as UpdateCategoryInput);
      } else {
        await addCategory(data as CreateCategoryInput);
      }
      handleCloseCategoryModal();
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    setIsDeletingCategory(true);
    try {
      await deleteCategory(category.id);
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const displayedCategories = categoryTab === "expense" ? getExpenseCategories() : getIncomeCategories();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-4" />
          <p style={{ color: "var(--text-muted)" }}>Carregando perfil...</p>
        </div>
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Container */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Meu Perfil
          </h1>
          <p className="mt-1" style={{ color: "var(--text-dimmed)" }}>
            Gerencie suas informações pessoais
          </p>
        </header>

        {/* Profile Card */}
        <div className="mb-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-violet-500/25">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {profile?.name || "Usuário"}
              </h2>
              <p className="text-[var(--text-muted)]">{profile?.email}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-dimmed)]">
                <Calendar className="w-3 h-3" />
                <span>
                  Membro desde{" "}
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })
                    : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Informações Pessoais */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <User className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Informações Pessoais
                  </h3>
                  <p className="text-sm text-[var(--text-dimmed)]">
                    Atualize seu nome e email
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
              {profileMessage && (
                <div
                  className={`p-4 rounded-xl flex items-center gap-3 ${
                    profileMessage.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  }`}
                >
                  {profileMessage.type === "success" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span
                    className={
                      profileMessage.type === "success"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {profileMessage.text}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  Nome
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50"
              >
                {isUpdatingProfile ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Alterar Senha */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Alterar Senha
                  </h3>
                  <p className="text-sm text-[var(--text-dimmed)]">
                    Mantenha sua conta segura
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-5">
              {passwordMessage && (
                <div
                  className={`p-4 rounded-xl flex items-center gap-3 ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span
                    className={
                      passwordMessage.type === "success"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {passwordMessage.text}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  Senha Atual
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    required
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-12 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)] hover:text-[var(--text-muted)]"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-12 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)] hover:text-[var(--text-muted)]"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor: i < passwordStrength ? strengthColors[passwordStrength - 1] : "var(--border-color)",
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: passwordStrength > 0 ? strengthColors[passwordStrength - 1] : "var(--text-muted)" }}
                    >
                      {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : "Digite uma senha"}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-12 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)] hover:text-[var(--text-muted)]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {/* Password match indicator */}
                {confirmPassword && (
                  <p
                    className="text-xs mt-2"
                    style={{ color: newPassword === confirmPassword ? "#22c55e" : "#ef4444" }}
                  >
                    {newPassword === confirmPassword ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
              >
                {isUpdatingPassword ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Alterar Senha
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Categorias Personalizadas */}
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
                  onClick={() => handleOpenCategoryModal()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Nova
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Tabs */}
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

              {/* Lista de categorias */}
              {isCategoriesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 text-violet-500 animate-spin mx-auto mb-2" />
                  <p className="text-[var(--text-dimmed)]">Carregando categorias...</p>
                </div>
              ) : (
                <CategoryList
                  categories={displayedCategories}
                  onEdit={handleOpenCategoryModal}
                  onDelete={handleDeleteCategory}
                  isDeleting={isDeletingCategory}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Categoria */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        onSave={handleSaveCategory}
        isSubmitting={isSavingCategory}
        category={editingCategory}
      />
    </div>
  );
}
