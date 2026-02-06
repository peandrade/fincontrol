"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Camera,
  Check,
  X,
  Pencil,
  Loader2,
} from "lucide-react";
import { useUser } from "@/contexts";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshProfile: refreshUserContext } = useUser();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditedName(data.name || "");
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editedName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsEditingName(false);
        await refreshUserContext();
        showMessage("success", t("nameUpdated"));
      } else {
        showMessage("error", t("nameUpdateError"));
      }
    } catch (error) {
      console.error("Erro ao salvar nome:", error);
      showMessage("error", t("nameUpdateError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage("error", t("imageTooLarge"));
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;

      setIsSaving(true);
      try {
        const response = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          await refreshUserContext();
          showMessage("success", t("photoUpdated"));
        } else {
          showMessage("error", t("photoUpdateError"));
        }
      } catch (error) {
        console.error("Erro ao salvar foto:", error);
        showMessage("error", t("photoUpdateError"));
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const userInitial = profile?.name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || "U";

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-secondary) 10%, transparent)" }}
        />
      </div>

      {}
      <div className="relative max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {}
        <button
          onClick={() => router.push("/conta")}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tc("back")}</span>
        </button>

        {}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            {t("profile")}
          </h1>
          <p className="text-[var(--text-dimmed)] mt-1">
            {t("profileDesc")}
          </p>
        </div>

        {}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === "success"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {}
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
          {}
          <div className="p-6 border-b border-[var(--border-color)]">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {}
              <div className="relative group">
                {profile?.image ? (
                  <img
                    src={profile.image}
                    alt="Foto de perfil"
                    className="w-24 h-24 rounded-full object-cover border-4"
                    style={{ borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)" }}
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full bg-primary-gradient flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-primary border-4"
                    style={{ borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)" }}
                  >
                    {userInitial}
                  </div>
                )}

                {}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="absolute bottom-0 right-0 p-2 rounded-full text-white shadow-lg transition-all disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {}
              <div className="text-center sm:text-left">
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {profile?.name || t("noName")}
                </p>
                <p className="text-[var(--text-dimmed)]">{profile?.email}</p>
              </div>
            </div>
          </div>

          {}
          <div className="divide-y divide-[var(--border-color)]">
            {}
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
                    <User className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-dimmed)]">{tc("name")}</p>
                    {isEditingName ? (
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="mt-1 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none"
                        style={{ borderColor: "var(--color-primary)" }}
                        autoFocus
                      />
                    ) : (
                      <p className="text-[var(--text-primary)] font-medium">
                        {profile?.name || t("notDefined")}
                      </p>
                    )}
                  </div>
                </div>

                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveName}
                      disabled={isSaving || !editedName.trim()}
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setEditedName(profile?.name || "");
                      }}
                      className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-2 rounded-lg transition-all hover:bg-primary-soft"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {}
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-dimmed)]">{t("email")}</p>
                  <p className="text-[var(--text-primary)] font-medium">
                    {profile?.email}
                  </p>
                </div>
              </div>
            </div>

            {}
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-dimmed)]">{t("memberSince")}</p>
                  <p className="text-[var(--text-primary)] font-medium">
                    {profile?.createdAt ? formatDate(profile.createdAt) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
