import { toast } from 'react-toastify';

export const useFormSubmission = (options = {}) => {
  const { onSuccess, onError, successMessage } = options;

  const handleSubmit = async (submitFn, data, editingItem = null) => {
    try {
      if (editingItem) {
        await submitFn(editingItem.id, data);
        toast.success(successMessage?.update ?? 'Item updated successfully!');
      } else {
        await submitFn(data);
        toast.success(successMessage?.create ?? 'Item created successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map(err => err.msg ?? err.message ?? JSON.stringify(err))
          .filter((msg, index, self) => self.indexOf(msg) === index)
          .join(', ');
        toast.error(`Validation Error: ${validationErrors}`, { autoClose: 5000 });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        const errorMsg = error.response?.data?.error ?? error.message ?? 'Failed to save';
        toast.error(errorMsg);
      }

      if (onError) {
        onError(error);
      }
    }
  };

  return { handleSubmit };
};

