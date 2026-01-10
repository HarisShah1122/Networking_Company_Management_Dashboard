import Modal from './Modal';

export default function ConfirmModal({
  isOpen,
  onClose,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  isLoading = false,
  confirmColor = 'bg-red-600 hover:bg-red-700',
  itemName,
}) {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  // Generate message if itemName is provided
  const displayMessage = message ?? (
    itemName ? (
      <>
        Are you sure you want to delete <strong>{itemName}</strong>? 
        This action cannot be undone.
      </>
    ) : (
      'Are you sure you want to proceed? This action cannot be undone.'
    )
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          {displayMessage}
        </p>
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 ${confirmColor} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

