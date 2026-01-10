import { useState, useCallback } from 'react';

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [editingItem, setEditingItem] = useState(null);

  const open = useCallback((item = null) => {
    setEditingItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingItem(null);
  }, []);

  const reset = useCallback(() => {
    setEditingItem(null);
  }, []);

  return { isOpen, editingItem, open, close, reset, setEditingItem };
};

