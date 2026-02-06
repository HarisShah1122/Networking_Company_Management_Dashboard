import { STATUS_LABELS, PRIORITY_LABELS } from '../../constants/complaintConstants';
import UserSearchDropdown from '../common/UserSearchDropdown';

const ComplaintForm = ({ 
  register, 
  errors, 
  touchedFields, 
  customers, 
  selectedCustomer, 
  setSelectedCustomer,
  editingComplaint,
  onSubmit,
  onCancel,
  setValue,
  watchedCustomerId
}) => {
  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">User ID *</label>
        <UserSearchDropdown
          value={watchedCustomerId || ''}
          onChange={(value) => setValue('customerId', value)}
          onCustomerSelect={(customer) => setSelectedCustomer(customer)}
          error={errors.customerId && touchedFields.customerId ? errors.customerId.message : ''}
          placeholder="Search user by name, PACE ID, phone..."
        />
        {/* Hidden field for validation */}
        <input
          type="hidden"
          {...register('customerId', {
            required: 'User ID is required',
            validate: (value) => !!value || 'Please select a valid user',
          })}
        />
      </div>

      {selectedCustomer && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-3">User Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-600 block">ID</span>
              <p className="font-mono">{selectedCustomer.id || '-'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-600 block">Name</span>
              <p>{selectedCustomer.name || '-'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-600 block">WhatsApp</span>
              <p>{selectedCustomer.whatsapp_number || selectedCustomer.phone || '-'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-600 block">PACE ID</span>
              <p className="font-mono">{selectedCustomer.pace_user_id || '-'}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-xs text-gray-600 block">Area</span>
              <p>{selectedCustomer.area?.name || selectedCustomer.area_name || '-'}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Title *</label>
        <input
          {...register('title', { required: 'Title is required' })}
          className={`mt-1 block w-full px-3 py-2 border rounded-md ${
            errors.title && touchedFields.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter complaint title"
        />
        {errors.title && touchedFields.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description *</label>
        <textarea
          {...register('description', { required: 'Description is required' })}
          className={`mt-1 block w-full px-3 py-2 border rounded-md ${
            errors.description && touchedFields.description ? 'border-red-500' : 'border-gray-300'
          }`}
          rows="4"
          placeholder="Enter complaint description"
        />
        {errors.description && touchedFields.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            {...register('status')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Priority</label>
          <select
            {...register('priority')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default ComplaintForm;
