"use client";

import { Calendar } from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
}

interface ProfileHeaderProps {
  profile: UserProfile | null;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="mb-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-primary-gradient flex items-center justify-center text-3xl shadow-lg shadow-primary">
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
  );
}
