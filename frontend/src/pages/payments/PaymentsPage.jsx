import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import apiClient from '../../services/api/apiClient';

const PaymentsPage = () => {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, touchedFields } } = useForm();

  const canManage = isManager(user?.role);

  useEffect(() => {
    loadCustomers();
    loadPayments();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAll();
      let customersList = [];
      if (response?.data && Array.isArray(response.data)) {
        customersList = response.data;
      } else if (Array.isArray(response)) {
        customersList = response;
      }
      setCustomers(customersList);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/payments');
      const paymentsList = response.data.data?.payments || response.data.payments || [];
      setPayments(paymentsList);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('trxId', data.trxId);
      formData.append('customerId', data.customerId);
      formData.append('amount', data.amount);
      formData.append('paymentMethod', data.paymentMethod || 'cash');
      formData.append('receivedBy', user.id);
      if (selectedImage) {
        formData.append('receiptImage', selectedImage);
      }

      await apiClient.post('/payments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Payment recorded successfully!');
      reset();
      setShowModal(false);
      setSelectedImage(null);
      setImagePreview(null);
      await loadPayments();
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.response?.data?.error ?? 'Failed to record payment';
      toast.error(errorMsg);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        {canManage && (
          <button
            onClick={() => { reset(); setShowModal(true); setSelectedImage(null); setImagePreview(null); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Payment
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TRX ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const customer = customers.find(c => c.id === payment.customerId);
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{payment.trxId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">RS {parseFloat(payment.amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{payment.paymentMethod || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.receiptImage ? (
                        <a
                          href={`http://localhost:5000${payment.receiptImage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Image
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && canManage && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); reset(); setSelectedImage(null); setImagePreview(null); }}
          title="Add Payment"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">TRX ID *</label>
              <input
                {...register('trxId', { required: 'TRX ID is required' })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                  errors.trxId && touchedFields.trxId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter transaction ID"
              />
              {errors.trxId && touchedFields.trxId && <p className="text-red-500 text-sm mt-1">{errors.trxId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Customer *</label>
              <select
                {...register('customerId', { required: 'Customer is required' })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                  errors.customerId && touchedFields.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.pace_user_id ? `(${customer.pace_user_id})` : ''}
                  </option>
                ))}
              </select>
              {errors.customerId && touchedFields.customerId && <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount *</label>
                <input
                  {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Amount must be greater than 0' } })}
                  type="number"
                  step="0.01"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                    errors.amount && touchedFields.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.amount && touchedFields.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  {...register('paymentMethod')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_wallet">Mobile Wallet</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Receipt Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Receipt preview" className="max-w-xs h-auto rounded" />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); reset(); setSelectedImage(null); setImagePreview(null); }}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">
                Save Payment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PaymentsPage;

