"use client";

import { useState, useCallback } from "react";

interface ModalState<T = unknown> {
  isOpen: boolean;
  data: T | null;
}

interface UseModalStateReturn<T> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Generic hook for managing modal state.
 * Handles open/close state and optional data to pass to the modal.
 *
 * @example
 * // Simple modal (no data)
 * const modal = useModalState();
 * <button onClick={modal.open}>Open</button>
 * <Modal isOpen={modal.isOpen} onClose={modal.close} />
 *
 * @example
 * // Modal with data (e.g., edit modal)
 * const editModal = useModalState<User>();
 * <button onClick={() => editModal.open(user)}>Edit</button>
 * <EditModal isOpen={editModal.isOpen} user={editModal.data} onClose={editModal.close} />
 */
export function useModalState<T = unknown>(
  initialOpen = false
): UseModalStateReturn<T> {
  const [state, setState] = useState<ModalState<T>>({
    isOpen: initialOpen,
    data: null,
  });

  const open = useCallback((data?: T) => {
    setState({ isOpen: true, data: data ?? null });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, data: null });
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => ({ isOpen: !prev.isOpen, data: prev.isOpen ? null : prev.data }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
  };
}
