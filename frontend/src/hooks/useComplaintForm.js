import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { validateComplaintForm, prepareComplaintSubmitData } from '../utils/complaintHelpers';
import { COMPLAINT_STATUS, COMPLAINT_PRIORITY } from '../constants/complaintConstants';

export const useComplaintForm = (customers, editingComplaint, selectedCustomer, setSelectedCustomer) => {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, touchedFields } } = useForm();
  const watchedCustomerId = watch('customerId');

  useEffect(() => {
    if (!watchedCustomerId) {
      setSelectedCustomer(null);
      setValue('name', '');
      setValue('address', '');
      setValue('whatsapp_number', '');
      return;
    }

    const customer = customers.find(c => String(c.id) === String(watchedCustomerId));
    if (customer) {
      setSelectedCustomer(customer);
      setValue('name', customer.name || '');
      setValue('address', customer.address || '');
      setValue('whatsapp_number', customer.whatsapp_number || customer.phone || '');
    } else {
      setSelectedCustomer(null);
      setValue('name', '');
      setValue('address', '');
      setValue('whatsapp_number', '');
    }
  }, [watchedCustomerId, customers, setValue, setSelectedCustomer]);

  const initializeForm = (complaint) => {
    const customerId = complaint.customerId ?? complaint.customer_id ?? '';
    const customer = customers.find(c => String(c.id) === String(customerId));
    setSelectedCustomer(customer || null);

    reset({
      customerId: customerId,
      name: complaint.name ?? '',
      address: complaint.address ?? '',
      whatsapp_number: complaint.whatsapp_number ?? '',
      title: complaint.title ?? '',
      description: complaint.description ?? '',
      status: complaint.status ?? COMPLAINT_STATUS.OPEN,
      priority: complaint.priority ?? COMPLAINT_PRIORITY.MEDIUM,
    });
  };

  const resetForm = () => {
    reset();
    setSelectedCustomer(null);
  };

  const validateAndPrepareData = (data) => {
    const validation = validateComplaintForm(data);
    if (!validation.isValid) {
      Object.entries(validation.errors).forEach(([field, message]) => {
        toast.error(message);
      });
      return null;
    }

    return prepareComplaintSubmitData(data, selectedCustomer);
  };

  return {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    errors,
    touchedFields,
    watchedCustomerId,
    initializeForm,
    resetForm,
    validateAndPrepareData
  };
};
