"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw } from "lucide-react";
import {
  ProfileHeader,
  ProfileForm,
  ChangePasswordSection,
  CategorySection,
} from "@/components/profile";

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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-color animate-spin mx-auto mb-4" />
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
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-medium rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
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

        {/* Profile Header */}
        <ProfileHeader profile={profile} />

        {/* Sections */}
        <div className="grid gap-6">
          <ProfileForm
            profile={profile}
            onUpdate={setProfile}
            updateSession={updateSession}
          />

          <ChangePasswordSection />

          <CategorySection />
        </div>
      </div>
    </div>
  );
}
