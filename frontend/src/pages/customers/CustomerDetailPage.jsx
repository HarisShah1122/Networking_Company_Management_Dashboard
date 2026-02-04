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
        
        // Handle different response formats for recharges
        let rechargesData = [];
        if (rechRes?.data?.recharges) {
          rechargesData = rechRes.data.recharges;
        } else if (rechRes?.recharges) {
          rechargesData = rechRes.recharges;
        } else if (Array.isArray(rechRes)) {
          rechargesData = rechRes;
        } else if (Array.isArray(rechRes?.data)) {
          rechargesData = rechRes.data;
        }
        
        console.log('Connections data:', connectionsData);
        console.log('Recharges data:', rechargesData);
        
        setConnections(connectionsData);
        setRecharges(rechargesData);
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

      {/* Customer Activity Section - Combined Connections & Recharges */}
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

            {/* Recharges Column */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recharges ({recharges.length})
              </h3>
              {recharges.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No recharges yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add a recharge to track payments</p>
                  <button 
                    onClick={() => navigate('/recharges')}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Add Recharge
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recharges.map((recharge) => (
                    <div key={recharge.id} className="border border-gray-200 rounded-lg p-4">
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
                        <p>Payment: {recharge.payment_method || '-'}</p>
                        {recharge.due_date && (
                          <p>Due: {new Date(recharge.due_date).toLocaleDateString()}</p>
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
    </div>
  );
};

export default CustomerDetailPage;