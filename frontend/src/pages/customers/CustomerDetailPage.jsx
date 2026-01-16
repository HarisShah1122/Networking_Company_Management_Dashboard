import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { connectionService } from '../../services/connectionService';
import { rechargeService } from '../../services/rechargeService';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [connections, setConnections] = useState([]);
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [customerData, connectionsData, rechargesData] = await Promise.all([
        customerService.getById(id),
        connectionService.getAll({ customer_id: id }),
        rechargeService.getAll({ customer_id: id }),
      ]);
      setCustomer(customerData.customer);
      setConnections(connectionsData.connections ?? []);
      setRecharges(rechargesData.recharges ?? []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!customer) return <div className="text-center py-8">Customer not found</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/customers')} className="text-indigo-600 hover:text-indigo-900">
        ← Back to Customers
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-4">{customer.name}</h1>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{customer.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{customer.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`px-2 py-1 text-xs rounded-full ${
              customer.status === 'active' ? 'bg-green-100 text-green-800' :
              customer.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {customer.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-medium">{customer.address || '-'}</p>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Connections ({connections.length})</h2>
          {connections.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No connections found</p>
          ) : (
            <div className="space-y-3">
              {connections.map((conn) => (
                <div key={conn.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-lg">{conn.connection_type || 'N/A'}</span>
                      {conn.notes && (
                        <p className="text-sm text-gray-600 mt-1">{conn.notes}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      conn.status === 'completed' ? 'bg-green-600 text-white' :
                      conn.status === 'pending' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {conn.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    {conn.installation_date && (
                      <div>
                        <span className="text-gray-600">Registration:</span>
                        <span className="ml-2 font-medium">{new Date(conn.installation_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {conn.activation_date && (
                      <div>
                        <span className="text-gray-600">Activation:</span>
                        <span className="ml-2 font-medium">{new Date(conn.activation_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {conn.created_at && (
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <span className="ml-2 font-medium">{new Date(conn.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recharges ({recharges.length})</h2>
          <div className="space-y-2">
            {recharges.map((recharge) => (
              <div key={recharge.id} className="border rounded p-3">
                <div className="flex justify-between">
                  <span className="font-medium">RS {parseFloat(recharge.amount).toFixed(2)}</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    recharge.status === 'paid' ? 'bg-green-100 text-green-800' :
                    recharge.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {recharge.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Payment: {recharge.payment_method}</p>
                {recharge.due_date && (
                  <p className="text-sm text-gray-600">Due: {new Date(recharge.due_date).toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;

