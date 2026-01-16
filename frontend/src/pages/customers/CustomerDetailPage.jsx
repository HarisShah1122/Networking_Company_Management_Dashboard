import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { connectionService } from '../../services/connectionService';
import { rechargeService } from '../../services/rechargeService';
import Loader from '../../components/common/Loader';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [connections, setConnections] = useState([]);
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setConnections(connRes?.connections || connRes?.data?.connections || connRes?.data || []);
        setRecharges(rechRes?.recharges || rechRes?.data?.recharges || rechRes?.data || []);
      } catch (error) {
        console.error('Error loading customer details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) return <Loader />;
  if (!customer) return <div className="text-center py-12 text-gray-500">Customer not found</div>;

  return (
    <div className="space-y-8 p-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/customers')}
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
      >
        ← Back to Customers
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

      {/* Connections Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Connections ({connections.length})</h2>
        </div>

        <div className="p-6">
          {connections.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No connections found for this customer</p>
          ) : (
            <div className="space-y-5">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {conn.connection_type || 'Unknown Type'}
                      </h3>
                      {conn.notes && (
                        <p className="text-sm text-gray-600 mt-1">{conn.notes}</p>
                      )}
                    </div>

                    <span
                      className={`px-4 py-1.5 text-sm font-medium rounded-full ${
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

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    {conn.installation_date && (
                      <div>
                        <p className="text-gray-500">Registration Date</p>
                        <p className="font-medium">
                          {new Date(conn.installation_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {conn.activation_date && (
                      <div>
                        <p className="text-gray-500">Activation Date</p>
                        <p className="font-medium">
                          {new Date(conn.activation_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {conn.created_at && (
                      <div>
                        <p className="text-gray-500">Created At</p>
                        <p className="font-medium">
                          {new Date(conn.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recharges Section - can be expanded similarly if needed */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recharges ({recharges.length})</h2>
        </div>
        <div className="p-6">
          {recharges.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No recharges found</p>
          ) : (
            <div className="space-y-4">
              {recharges.map((recharge) => (
                <div key={recharge.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">
                      RS {parseFloat(recharge.amount || 0).toFixed(2)}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        recharge.status === 'paid'
                          ? 'bg-green-600 text-white'
                          : recharge.status === 'pending'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {recharge.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Payment Method: {recharge.payment_method || '-'}</p>
                    {recharge.due_date && (
                      <p>Due Date: {new Date(recharge.due_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;