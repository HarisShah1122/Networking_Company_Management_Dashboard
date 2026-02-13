import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';
import { connectionService } from '../../services/connectionService';
import { rechargeService } from '../../services/rechargeService';
import { paymentService } from '../../services/enhancedPaymentService';
import useAuthStore from '../../stores/authStore';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [customer, setCustomer] = useState(null);
  const [connections, setConnections] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [custRes, connRes, rechRes] = await Promise.all([
          customerService.getById(id),
          connectionService.getAll({ customer_id: id }),
          rechargeService.getAll({ customer_id: id }),
        ]);

        setCustomer(custRes?.customer || custRes?.data || null);
        
        // Handle different response formats for connections
        let connectionsData = [];
        if (connRes?.data?.connections) {
          connectionsData = connRes.data.connections;
        } else if (connRes?.connections) {
          connectionsData = connRes.connections;
        } else if (Array.isArray(connRes)) {
          connectionsData = connRes;
        } else if (Array.isArray(connRes?.data)) {
          connectionsData = connRes.data;
        }
        
        // Handle different response formats for payments
        let paymentsData = [];
        if (rechRes?.data?.recharges) {
          paymentsData = rechRes.data.recharges;
        } else if (rechRes?.recharges) {
          paymentsData = rechRes.recharges;
        } else if (Array.isArray(rechRes)) {
          paymentsData = rechRes;
        } else if (Array.isArray(rechRes?.data)) {
          paymentsData = rechRes.data;
        }
        
        console.log('Connections data:', connectionsData);
        console.log('Payments data:', paymentsData);
        
        setConnections(connectionsData);
        setPayments(paymentsData);
      } catch (error) {
        console.error('Error loading customer details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onPaymentSubmit = async (data) => {
    const paymentStartTime = Date.now();
    
    try {
      setIsSubmittingPayment(true);
      
      let submitData;
      const hasFile = selectedImage instanceof File;

      if (hasFile) {
        const formData = new FormData();
        formData.append('trxId', data.trxId?.trim());
        formData.append('customerId', id);
        formData.append('amount', data.amount);
        formData.append('paymentMethod', data.paymentMethod || 'cash');
        formData.append('receivedBy', user.id);
        formData.append('receiptImage', selectedImage);
        submitData = formData;
      } else {
        submitData = {
          trxId: data.trxId?.trim(),
          customerId: id,
          amount: data.amount,
          paymentMethod: data.paymentMethod || 'cash',
          receivedBy: user.id,
        };
      }

      console.log('🚀 Submitting payment:', {
        trxId: data.trxId,
        amount: data.amount,
        hasFile,
        customerId: id
      });

      const response = await paymentService.create(submitData);
      
      const paymentDuration = Date.now() - paymentStartTime;
      console.log(`✅ Payment successful in ${paymentDuration}ms:`, response);
      
      if (response?.success || response?.data?.success) {
        toast.success('Payment added successfully!');
        reset();
        setShowPaymentModal(false);
        setSelectedImage(null);
        setImagePreview(null);
        
        // Reload payments to show new payment
        const rechRes = await rechargeService.getAll({ customer_id: id });
        let paymentsData = [];
        if (rechRes?.data?.recharges) {
          paymentsData = rechRes.data.recharges;
        } else if (rechRes?.recharges) {
          paymentsData = rechRes.recharges;
        } else if (Array.isArray(rechRes)) {
          paymentsData = rechRes;
        } else if (Array.isArray(rechRes?.data)) {
          paymentsData = rechRes.data;
        }
        setPayments(paymentsData);
      } else {
        throw new Error(response?.message || 'Failed to add payment');
      }
    } catch (error) {
      const paymentDuration = Date.now() - paymentStartTime;
      console.error('❌ Payment failed after', paymentDuration + 'ms:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
      // Enhanced error handling with specific user feedback
      let errorMessage = 'Failed to add payment';
      let errorDetails = '';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
        errorDetails = 'The payment request took too long to complete.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection.';
        errorDetails = 'Unable to connect to the server.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
        errorDetails = 'The server is temporarily down for maintenance.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait and try again.';
        errorDetails = 'Rate limit exceeded. Please wait before trying again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
        errorDetails = 'The server encountered an internal error.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication expired. Please log in again.';
        errorDetails = 'Your session has expired.';
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large. Please choose a smaller image.';
        errorDetails = 'The receipt image exceeds the maximum size limit.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        errorDetails = 'Server provided specific error details.';
      } else if (error.message) {
        errorMessage = error.message;
        errorDetails = 'Client-side error occurred.';
      }
      
      // Show detailed error toast
      toast.error(errorMessage, { 
        autoClose: 5000,
        toastId: `payment-error-${Date.now()}`,
        position: 'top-right'
      });
      
      // Log error details for debugging
      console.error('🔍 Payment Error Details:', {
        userMessage: errorMessage,
        technicalDetails: errorDetails,
        duration: paymentDuration + 'ms',
        customerId: id,
        trxId: data.trxId,
        amount: data.amount
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const openPaymentModal = () => {
    reset();
    setSelectedImage(null);
    setImagePreview(null);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    reset();
    setSelectedImage(null);
    setImagePreview(null);
    setShowPaymentModal(false);
  };

  if (loading) return <Loader />;
  if (!customer) return <div className="text-center py-12 text-gray-500">Customer not found</div>;

  return (
    <div className="space-y-8 p-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/customers')}
        className="group inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 text-gray-700 hover:text-gray-900 font-medium"
      >
        <svg 
          className="mr-2 h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Customers
      </button>

      {/* Customer Info Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
        </div>

        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-base text-gray-900">{customer.phone || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-base text-gray-900">{customer.email || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex px-3 py-1.5 text-xs font-medium rounded-full ${
                    customer.status === 'active'
                      ? 'bg-green-600 text-white'
                      : customer.status === 'inactive'
                      ? 'bg-gray-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {customer.status || 'unknown'}
                </span>
              </dd>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-base text-gray-900">{customer.address || '-'}</dd>
            </div>

            {customer.father_name && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Father Name</dt>
                <dd className="mt-1 text-base text-gray-900">{customer.father_name}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Customer Activity Section - Combined Connections & Payments */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Customer Activity</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Connections Column */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Connections ({connections.length})
              </h3>
              {connections.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No connections yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add a connection to get started</p>
                  <button 
                    onClick={() => navigate('/connections')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Add Connection
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((conn) => (
                    <div
                      key={conn.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {conn.connection_type || 'Unknown Type'}
                          </h4>
                          {conn.notes && (
                            <p className="text-sm text-gray-600 mt-1">{conn.notes}</p>
                          )}
                        </div>

                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            conn.status === 'completed'
                              ? 'bg-green-600 text-white'
                              : conn.status === 'pending'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}
                        >
                          {conn.status || 'unknown'}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600">
                        {conn.installation_date && (
                          <p>Installed: {new Date(conn.installation_date).toLocaleDateString()}</p>
                        )}
                        {conn.activation_date && (
                          <p>Activated: {new Date(conn.activation_date).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payments Column */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Payments ({payments.length})
              </h3>
              {payments.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No payments yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add a payment to track transactions</p>
                  <button 
                    onClick={openPaymentModal}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Add Payment
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">
                          RS {parseFloat(payment.amount || 0).toFixed(2)}
                        </span>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            payment.status === 'paid'
                              ? 'bg-green-600 text-white'
                              : payment.status === 'pending'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Payment: {payment.payment_method || '-'}</p>
                        {payment.due_date && (
                          <p>Due: {new Date(payment.due_date).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <Modal
          isOpen={showPaymentModal}
          onClose={closePaymentModal}
          title="Add Payment"
        >
          <form onSubmit={handleSubmit(onPaymentSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction ID *</label>
              <input
                {...register('trxId', { required: 'Transaction ID is required' })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md ${errors.trxId ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter transaction ID"
              />
              {errors.trxId && <p className="text-red-500 text-sm mt-1">{errors.trxId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (PKR) *</label>
                <input
                  {...register('amount', { required: 'Amount is required', min: 0.01 })}
                  type="number"
                  step="0.01"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0.00"
                />
                {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
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
                onClick={closePaymentModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPayment}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-green-400 flex items-center justify-center min-w-[120px]"
              >
                {isSubmittingPayment ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Add Payment'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CustomerDetailPage;