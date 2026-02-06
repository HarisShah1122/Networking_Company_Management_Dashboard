import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';
import { paymentService } from '../../services/paymentService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';
import apiClient from '../../services/api/apiClient';

const PaymentsPage = () => {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Recharge functionality moved to Payments
  const [packageFilter, setPackageFilter] = useState('');

  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, watch, formState: { errors, touchedFields } } = useForm();
  const watchedCustomerId = watch('customerId');

  const canManage = isManager(user?.role);

  const loadCustomers = useCallback(async () => {
    try {
      const response = await customerService.getAll();
      let list = Array.isArray(response) ? response : (response?.customers ?? response?.data?.customers ?? response?.data ?? []);
      list = list.filter(c => c?.id);
      setCustomers(list);
    } catch (error) {
      toast.error('Failed to load customers');
      setCustomers([]);
    }
  }, []);

  const loadPayments = useCallback(async (search = '', status = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      else setSearching(true);

      // Load regular payments
      const response = await apiClient.get('/payments');
      let list = Array.isArray(response.data) ? response.data
                : (response.data?.payments ?? response.data?.data?.payments ?? []);

      // Load due payments (recharge functionality)
      try {
        const dueResponse = await apiClient.get('/recharges/due');
        const duePaymentsList = Array.isArray(dueResponse.data) ? dueResponse.data.duePayments : 
          (dueResponse.data?.data?.duePayments ?? []);
        
        // Combine payments and due payments
        list = [...list, ...duePaymentsList];
      } catch (error) {
        console.warn('Failed to load due payments:', error);
      }

      // Apply filters
      list = list.map(p => ({
        ...p,
        id: p.id ?? '',
        trxId: p.trx_id ?? p.trxId ?? '-',
        customerId: p.customer_id ?? p.customerId ?? null,
        amount: p.amount ?? 0,
        paymentMethod: p.payment_method ?? p.paymentMethod ?? '-',
        receiptImage: p.receipt_image ?? p.receiptImage ?? null,
        createdAt: p.createdAt ?? p.created_at ?? null,
        status: p.status ?? 'pending',
        // Add recharge-specific fields
        package: p.package || null,
        dueDate: p.due_date || null,
      }));

      if (search?.trim()) {
        const searchLower = search.toLowerCase().trim();
        list = list.filter(p =>
          (p.customerName ?? '').toLowerCase().includes(searchLower) ||
          (p.paceUserId ?? '').toLowerCase().includes(searchLower) ||
          (p.trxId ?? '').toLowerCase().includes(searchLower) ||
          (p.trxId ?? '').toLowerCase().includes(searchLower) ||
          (p.whatsappNumber ?? '').includes(search) ||
          String(p.amount ?? '').includes(search) ||
          (p.package ?? '').toLowerCase().includes(searchLower)
        );
      }

      if (status) {
        list = list.filter(p => (p.status ?? 'pending') === status);
      }

      if (packageFilter) {
        list = list.filter(p => (p.package ?? '').toLowerCase().includes(packageFilter.toLowerCase()));
      }

      setPayments(list);
    } catch (err) {
      setPayments([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [customers, packageFilter]);

  useEffect(() => {
    if (isInitialMount.current) {
      (async () => {
        await loadCustomers();
        await loadPayments('', '', true);
      })();
      isInitialMount.current = false;
    }
  }, [loadCustomers, loadPayments]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      loadPayments(searchTerm, statusFilter, false);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm, statusFilter, packageFilter, loadPayments]);

  useEffect(() => {
    if (!watchedCustomerId) {
      setSelectedCustomer(null);
      return;
    }
    const customer = customers.find(c => String(c.id) === String(watchedCustomerId));
    setSelectedCustomer(customer ?? null);
  }, [watchedCustomerId, customers]);

  const onSubmit = async (data) => {
    try {
      let submitData;
      const hasFile = selectedImage instanceof File;

      if (hasFile) {
        const formData = new FormData();
        formData.append('trxId', data.trxId?.trim());
        formData.append('customerId', data.customerId);
        formData.append('amount', data.amount);
        formData.append('paymentMethod', data.paymentMethod || 'cash');
        formData.append('receivedBy', user.id);
        formData.append('receiptImage', selectedImage);
        submitData = formData;
      } else {
        submitData = {
          trxId: data.trxId?.trim(),
          customerId: data.customerId,
          amount: data.amount,
          paymentMethod: data.paymentMethod || 'cash',
          receivedBy: user.id,
        };
        if (editingPayment?.receiptImage) {
          submitData.receiptImage = editingPayment.receiptImage;
        }
      }

      let response;
      if (editingPayment) {
        response = await paymentService.update(editingPayment.id, submitData);
        toast.success('Payment updated successfully!');
      } else {
        response = await paymentService.create(submitData);
        toast.success('Payment recorded successfully!');
      }

      if (response?.success || response?.data?.success) {
        reset();
        setShowModal(false);
        setEditingPayment(null);
        setSelectedImage(null);
        setImagePreview(null);
        await loadPayments(searchTerm, statusFilter, false);
      } else {
        throw new Error(response?.message || 'Unexpected response');
      }
    } catch (error) {
      console.error('Save payment error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save payment');
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    reset({
      trxId: payment.trxId,
      customerId: payment.customerId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
    });
    if (payment.receiptImage) {
      setImagePreview(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'}${payment.receiptImage.startsWith('/') ? '' : '/'}${payment.receiptImage}`);
    } else {
      setImagePreview(null);
    }
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name, PACE ID, TRX ID, amount, phone, package..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={packageFilter}
          onChange={(e) => setPackageFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Packages</option>
          <option value="5 Mbps">5 Mbps</option>
          <option value="10 Mbps">10 Mbps</option>
          <option value="20 Mbps">20 Mbps</option>
          <option value="30 Mbps">30 Mbps</option>
          <option value="50 Mbps">50 Mbps</option>
        </select>

        {canManage && (
          <button
            onClick={() => { reset(); setSelectedImage(null); setImagePreview(null); setEditingPayment(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add Payment
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Scrollable container with hidden scrollbar */}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-max w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TRX ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PACE ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{payment.trxId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{payment.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{payment.paceUserId}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">RS {parseFloat(payment.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{payment.paymentMethod}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.receiptImage ? (
                        <a
                          href={`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'}${payment.receiptImage.startsWith('/') ? '' : '/'}${payment.receiptImage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canManage && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(payment)}
                            className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {payments.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <TablePagination
              pagination={{
                currentPage,
                totalPages: Math.ceil(payments.length / pageSize),
                totalCount: payments.length,
              }}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSize={pageSize}
              isFetching={searching}
            />
          </div>
        )}
      </div>

      {showModal && canManage && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); reset(); setSelectedImage(null); setImagePreview(null); setEditingPayment(null); }}
          title={editingPayment ? 'Edit Payment' : 'Add Payment'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">TRX ID *</label>
              <input
                {...register('trxId', { required: 'TRX ID is required' })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${errors.trxId && touchedFields.trxId ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter transaction ID"
              />
              {errors.trxId && touchedFields.trxId && <p className="text-red-500 text-sm mt-1">{errors.trxId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Customer *</label>
              <select
                {...register('customerId', { required: 'Customer is required' })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${errors.customerId && touchedFields.customerId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.pace_user_id ? `(PACE: ${c.pace_user_id})` : ''}
                  </option>
                ))}
              </select>
              {errors.customerId && touchedFields.customerId && <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>}
            </div>

            {selectedCustomer && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Details</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Customer ID</label>
                    <p className="font-mono">{selectedCustomer.id}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">PACE ID</label>
                    <p className="font-mono">{selectedCustomer.pace_user_id ?? '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">WhatsApp</label>
                    <p>{selectedCustomer.whatsapp_number ?? selectedCustomer.phone ?? '-'}</p>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-600">Address</label>
                    <p>{selectedCustomer.address ?? '-'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (PKR) *</label>
                <input
                  {...register('amount', { required: 'Amount is required', min: 0.01 })}
                  type="number"
                  step="0.01"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${errors.amount && touchedFields.amount ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0.00"
                />
                {errors.amount && touchedFields.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select {...register('paymentMethod')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_wallet">Mobile Wallet</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Receipt Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {imagePreview && (
                <div className="mt-3">
                  <img src={imagePreview} alt="preview" className="max-w-xs h-auto rounded shadow-sm" />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); reset(); setSelectedImage(null); setImagePreview(null); setEditingPayment(null); }}
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
