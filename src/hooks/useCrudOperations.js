import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

export const useCrudOperations = ({
  service,
  loadData,
  onSuccess,
  onError,
  successMessages = {
    create: 'Item created successfully!',
    update: 'Item updated successfully!',
    delete: 'Item deleted successfully!',
  },
}) => {
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
  }, []);

  const handleDelete = useCallback((item) => {
    setItemToDelete(item);
  }, []);

  const handleCreate = useCallback(async (data) => {
    setIsSubmitting(true);
    try {
      await service.create(data);
      toast.success(successMessages.create);
      if (onSuccess) onSuccess();
      if (loadData) await loadData();
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create item';
      toast.error(errorMsg);
      if (onError) onError(error);
      return { success: false, error: errorMsg };
    } finally {
      setIsSubmitting(false);
    }
  }, [service, loadData, onSuccess, onError, successMessages.create]);

  const handleUpdate = useCallback(async (id, data) => {
    setIsSubmitting(true);
    try {
      await service.update(id, data);
      toast.success(successMessages.update);
      if (onSuccess) onSuccess();
      if (loadData) await loadData();
      setEditingItem(null);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update item';
      toast.error(errorMsg);
      if (onError) onError(error);
      return { success: false, error: errorMsg };
    } finally {
      setIsSubmitting(false);
    }
  }, [service, loadData, onSuccess, onError, successMessages.update]);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    
    setIsSubmitting(true);
    try {
      await service.delete(itemToDelete.id);
      toast.success(successMessages.delete);
      if (onSuccess) onSuccess();
      if (loadData) await loadData();
      setItemToDelete(null);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to delete item';
      toast.error(errorMsg);
      if (onError) onError(error);
      return { success: false, error: errorMsg };
    } finally {
      setIsSubmitting(false);
    }
  }, [itemToDelete, service, loadData, onSuccess, onError, successMessages.delete]);

  const resetEdit = useCallback(() => {
    setEditingItem(null);
  }, []);

  const resetDelete = useCallback(() => {
    setItemToDelete(null);
  }, []);

  return {
    editingItem,
    itemToDelete,
    isSubmitting,
    handleEdit,
    handleDelete,
    handleCreate,
    handleUpdate,
    handleConfirmDelete,
    resetEdit,
    resetDelete,
  };
};

