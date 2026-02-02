"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

export function DeleteAccountSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText === "EXCLUIR";

  const handleDelete = () => {
    if (canDelete) {
      // TODO: Implement account deletion
      setIsExpanded(false);
      setConfirmText("");
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl border border-red-500/30 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-xl bg-red-500/10">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-red-400">Excluir Conta</h2>
          <p className="text-sm text-[var(--text-dimmed)]">Remover permanentemente sua conta e dados</p>
        </div>
      </div>

      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 rounded-xl border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-medium"
        >
          Excluir minha conta
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[var(--text-primary)] font-medium">Esta ação é irreversível!</p>
              <p className="text-xs text-[var(--text-dimmed)] mt-1">
                Todos os seus dados serão permanentemente excluídos. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
          <input
            type="text"
            placeholder="Digite 'EXCLUIR' para confirmar"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-red-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-red-500 mb-3"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setIsExpanded(false);
                setConfirmText("");
              }}
              className="p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={!canDelete}
              className="p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
