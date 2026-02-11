import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { paymentService } from '../../services/paymentService';
import { customerService } from '../../services/customerService';
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
      // Load customers with search parameter to get complete data
      const customersResponse = await customerService.getAll({ search: '' });
      let customersList = [];
      
      if (customersResponse?.data && Array.isArray(customersResponse.data)) {
        customersList = customersResponse.data;
      } else if (customersResponse?.customers && Array.isArray(customersResponse.customers)) {
        customersList = customersResponse.customers;
      } else if (Array.isArray(customersResponse)) {
        customersList = customersResponse;
      }
      
      console.log('Customers API response:', customersResponse);
      console.log('Customers list:', customersList);
      console.log('Customer with pace082:', customersList.find(c => (c.pace_user_id || '').toLowerCase() === 'pace082'));
      
      setCustomers(customersList);
      console.log('Using customers API data');
    } catch (error) {
      console.error('Failed to load customers:', error);
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
        // Map payment methods for display
        displayPaymentMethod: (() => {
          // Use original payment method if stored, otherwise use the backend method
          const method = p.original_payment_method ?? p.originalPaymentMethod ?? p.payment_method ?? p.paymentMethod ?? '-';
          switch(method) {
            case 'jazz_cash': return 'Jazz Cash';
            case 'easypaisa': return 'Easypaisa';
            case 'mobile_wallet': return 'Mobile Wallet';
            case 'bank_transfer': return 'Bank Transfer';
            case 'cash': return 'Cash';
            case 'card': return 'Card';
            default: return method?.charAt(0)?.toUpperCase() + method?.slice(1) || '-';
          }
        })(),
        receiptImage: p.receipt_image ?? p.receiptImage ?? null,
        createdAt: p.createdAt ?? p.created_at ?? null,
        status: p.status ?? 'pending',
        // Add recharge-specific fields
        package: p.package || null,
        dueDate: p.due_date || null,
        // Get PACE ID from customer relationship or direct field
        pace_user_id: p.customer?.pace_user_id || p.pace_user_id || p.customer?.paceUserId || null,
        // Get customer name from relationship
        customerName: p.customer?.name || p.customerName || p.customer?.username || '',
        // Get whatsapp number from relationship
        whatsappNumber: p.customer?.whatsapp_number || p.customer?.phone || p.whatsappNumber || '',
      }));

      // Search functionality
      if (search?.trim()) {
        const searchLower = search.toLowerCase().trim();
        list = list.filter(p => {
          // Search by customer name, PACE ID, TRX ID, amount, phone, package
          return (p.customerName ?? '').toLowerCase().includes(searchLower) ||
            (p.pace_user_id || '').toLowerCase().includes(searchLower) ||
            (p.trxId ?? '').toLowerCase().includes(searchLower) ||
            (p.whatsappNumber ?? '').includes(search) ||
            String(p.amount ?? '').includes(search) ||
            (p.package ?? '').toLowerCase().includes(searchLower);
        });
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
  }, [packageFilter]);

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

  // Ensure customers are loaded when modal opens
  useEffect(() => {
    if (showModal && customers.length === 0) {
      loadCustomers();
    }
  }, [showModal, customers.length, loadCustomers]);

  const onSubmit = async (data) => {
    try {
      let submitData;
      const hasFile = selectedImage instanceof File;

      if (hasFile) {
        const formData = new FormData();
        formData.append('trxId', data.trxId?.trim());
        formData.append('customerId', data.customerId);
        formData.append('amount', data.amount);
        // Store original payment method for display
        const originalPaymentMethod = data.paymentMethod || 'cash';
        // Map to backend-compatible value
        const mappedPaymentMethod = originalPaymentMethod === 'jazz_cash' || originalPaymentMethod === 'easypaisa' 
          ? 'mobile_wallet' 
          : originalPaymentMethod;
        formData.append('paymentMethod', mappedPaymentMethod);
        formData.append('originalPaymentMethod', originalPaymentMethod);
        formData.append('receivedBy', user.id);
        formData.append('receiptImage', selectedImage);
        submitData = formData;
      } else {
        const originalPaymentMethod = data.paymentMethod || 'cash';
        submitData = {
          trxId: data.trxId?.trim(),
          customerId: data.customerId,
          amount: data.amount,
          // Map to backend-compatible value
          paymentMethod: originalPaymentMethod === 'jazz_cash' || originalPaymentMethod === 'easypaisa' 
            ? 'mobile_wallet' 
            : originalPaymentMethod,
          originalPaymentMethod: originalPaymentMethod,
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
      paymentMethod: payment.originalPaymentMethod || payment.paymentMethod,
    });
    if (payment.receiptImage) {
      setImagePreview(`${process.env.REACT_APP_BASE_URL || 'http://127.0.0.1:5000'}${payment.receiptImage}`);
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
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search payments..."
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
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{payment.pace_user_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">RS {parseFloat(payment.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{payment.displayPaymentMethod || payment.paymentMethod}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.receiptImage ? (
                        <a
                          href={`${process.env.REACT_APP_BASE_URL || 'http://127.0.0.1:5000'}${payment.receiptImage}`}
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
              <label className="block text-sm font-medium text-gray-700">
                Customer {editingPayment ? '(Optional)' : '*'}
              </label>
              <div className="relative">
                <input
                  {...register('customerId', { 
                    required: !editingPayment ? 'Customer is required' : false 
                  })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${errors.customerId && touchedFields.customerId ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Type customer name or PACE ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {/* Customer Dropdown - Only show when no customer is selected */}
                {searchTerm && !selectedCustomer && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {(() => {
                      const searchLower = searchTerm.toLowerCase().trim();
                      console.log('Searching for:', searchLower); // Debug search term
                      
                      const matchedCustomers = customers.filter(c => {
                        const customerName = (c.name || c.username || '').toLowerCase();
                        const pace_user_id = (c.pace_user_id || c.paceUserId || '').toLowerCase();
                        const customerId = String(c.id || '').toLowerCase();
                        const searchLower = searchTerm.toLowerCase().trim();
                        
                        console.log('Checking customer:', {
                          name: customerName,
                          paceId: pace_user_id,
                          id: customerId,
                          search: searchLower,
                          allFields: Object.keys(c)
                        });
                        
                        // More flexible search - includes partial matches
                        const nameMatch = customerName.includes(searchLower);
                        const paceMatch = pace_user_id.includes(searchLower);
                        const idMatch = customerId.includes(searchLower);
                        const easypaiseMatch = customerName.includes('easypaise');
                        const jazzMatch = customerName.includes('jazz acshe');
                        
                        return nameMatch || paceMatch || idMatch || easypaiseMatch || jazzMatch;
                      });

                      // If no matches found, try a more comprehensive search
                      if (matchedCustomers.length === 0) {
                        const comprehensiveSearch = async () => {
                          try {
                            console.log('No matches found, trying comprehensive search...');
                            
                            // Try multiple search approaches
                            const [allCustomers, searchByName, searchByPace] = await Promise.allSettled([
                              customerService.getAll(),
                              customerService.getAll({ search: searchTerm }),
                              customerService.getAll({ search: `pace${searchTerm.replace('pace', '')}` })
                            ]);
                            
                            console.log('Search results:', {
                              allCustomers: allCustomers.status,
                              searchByName: searchByName.status,
                              searchByPace: searchByPace.status
                            });
                            
                            // Check each result for matches
                            const allSearchResults = [];
                            
                            if (allCustomers.status === 'fulfilled') {
                              const data = Array.isArray(allCustomers.value) ? allCustomers.value :
                                (allCustomers.value?.data ?? allCustomers.value?.customers ?? []);
                              allSearchResults.push(...data);
                            }
                            
                            if (searchByName.status === 'fulfilled') {
                              const data = Array.isArray(searchByName.value) ? searchByName.value :
                                (searchByName.value?.data ?? searchByName.value?.customers ?? []);
                              allSearchResults.push(...data);
                            }
                            
                            if (searchByPace.status === 'fulfilled') {
                              const data = Array.isArray(searchByPace.value) ? searchByPace.value :
                                (searchByPace.value?.data ?? searchByPace.value?.customers ?? []);
                              allSearchResults.push(...data);
                            }
                            
                            // Remove duplicates and find unique matches
                            const uniqueCustomers = allSearchResults.filter((customer, index, self) => 
                              self.findIndex(c => c.id === customer.id) === index
                            );
                            
                            console.log('Unique customers found:', uniqueCustomers);
                            
                            const finalMatches = uniqueCustomers.filter(c => {
                              const name = (c.name || c.username || '').toLowerCase();
                              const paceId = (c.pace_user_id || '').toLowerCase();
                              const id = String(c.id || '').toLowerCase();
                              
                              return name.includes(searchLower) || 
                                     paceId.includes(searchLower) || 
                                     id.includes(searchLower);
                            });
                            
                            console.log('Final matches:', finalMatches);
                            
                            if (finalMatches.length > 0) {
                              // Update customers list
                              setCustomers(prev => {
                                const existing = prev.filter(p => !finalMatches.find(f => f.id === p.id));
                                return [...existing, ...finalMatches];
                              });
                              
                              // Auto-select first match
                              const firstMatch = finalMatches[0];
                              reset({ ...watch(), customerId: firstMatch.id });
                              setSelectedCustomer(firstMatch);
                              setSearchTerm(firstMatch.name || firstMatch.username);
                            }
                          } catch (error) {
                            console.error('Comprehensive search failed:', error);
                          }
                        };
                        
                        comprehensiveSearch();
                      }
                      
                      console.log('Matched customers:', matchedCustomers); // Debug matches
                      console.log('Available customers:', customers); // Debug all customers

                      return matchedCustomers.length > 0 ? (
                        <div className="p-2">
                          <div className="text-xs text-gray-500 mb-2">Found {matchedCustomers.length} customer(s)</div>
                          {matchedCustomers.slice(0, 10).map((customer, index) => (
                            <button
                              key={`${customer.id}-${index}`}
                              type="button"
                              onClick={() => {
                                console.log('Selected customer:', customer); // Debug selection
                                reset({ ...watch(), customerId: customer.id });
                                setSelectedCustomer(customer);
                                setSearchTerm(customer.name);
                                // Don't clear customer if we're editing an existing payment
                                if (!editingPayment) {
                                  // Additional logic for new payments can go here
                                }
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-gray-500">ID: {customer.id}</div>
                                <div className="text-sm text-gray-500">PACE: {customer.pace_user_id || '-'}</div>
                              </div>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 text-gray-500 text-sm">
                          No customers found
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              {errors.customerId && touchedFields.customerId && <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>}
            </div>

            {selectedCustomer && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-900 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Customer Details
                  </h3>
                  <button
                    onClick={() => { 
                      setSelectedCustomer(null); 
                      if (!editingPayment) {
                        reset({ ...watch(), customerId: '' }); 
                        setSearchTerm(''); 
                      }
                    }}
                    className="text-blue-400 hover:text-blue-600 text-sm"
                  >
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-blue-700">Customer ID</label>
                    <p className="font-mono text-gray-900">{selectedCustomer.id}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700">PACE ID</label>
                    <p className="font-mono text-gray-900">{selectedCustomer.pace_user_id ?? '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700">WhatsApp</label>
                    <p className="text-gray-900">{selectedCustomer.whatsapp_number ?? selectedCustomer.phone ?? '-'}</p>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-blue-700">Address</label>
                    <p className="text-gray-900">{selectedCustomer.address ?? '-'}</p>
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
                  <option value="jazz_cash">Jazz Cash</option>
                  <option value="easypaisa">Easypaisa</option>
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

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => { reset(); setSelectedImage(null); setImagePreview(null); setEditingPayment(null); setShowModal(false); }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Payment
              </button>
            </div>
          </form>

          </Modal>
      )}
    </div>
  );
};

export default PaymentsPage;
