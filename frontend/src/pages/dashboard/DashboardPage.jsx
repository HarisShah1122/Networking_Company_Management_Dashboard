import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { customerService } from '../../services/customerService';
import { connectionService } from '../../services/connectionService';
import { rechargeService } from '../../services/rechargeService';
import { stockService } from '../../services/stockService';
import { transactionService } from '../../services/transactionService';
import { complaintService } from '../../services/complaintService';
import Loader from '../../components/common/Loader';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    customers: { total: 0, active: 0 },
    connections: { total: 0, pending: 0 },
    recharges: { total_paid: 0, total_pending: 0 },
    stock: { total_items: 0, total_value: 0 },
    transactions: { total_income: 0, total_expense: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [complaintData, setComplaintData] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
   
      const results = await Promise.allSettled([
        customerService.getStats().catch(() => ({ stats: {} })),
        connectionService.getStats().catch(() => ({ stats: {} })),
        rechargeService.getSummary().catch(() => ({ total_paid: 0, total_pending: 0 })),
        stockService.getStats().catch(() => ({ stats: {} })),
        transactionService.getSummary().catch(() => ({ summary: {} })),
        complaintService.getStats().catch(() => ({ stats: {} })),
        transactionService.getRevenueGrowth().catch(() => ({ data: [] })),
        complaintService.getAll().catch(() => []),
      ]);

      const [customers, connections, recharges, stock, transactions, complaintStats, revenueGrowth, recentComplaintsData] = results.map(r => 
        r.status === 'fulfilled' ? r.value : (r.reason || {})
      );

      const updatedStats = {
        customers: customers?.stats ?? customers ?? {},
        connections: connections?.stats ?? connections ?? {},
        recharges: recharges ?? {},
        stock: stock?.stats ?? stock ?? {},
        transactions: transactions?.summary ?? transactions ?? {},
      };
      setStats(updatedStats);

      // Revenue Growth (real data - last 12 months)
      const revenueGrowthData = (revenueGrowth?.data ?? []).map((row) => ({
        month: row.month || row.month_name || '',
        revenue: Number(row.revenue ?? row.total_revenue ?? 0),
      }));
      
      // Use real data only
      setRevenueData(revenueGrowthData);

      // Complaint Status (real data)
      const cs = complaintStats?.stats ?? complaintStats ?? {};
      setComplaintData([
        { name: 'Open', value: Number(cs.open ?? cs.Open ?? 0), color: '#EF4444' },
        { name: 'In Progress', value: Number(cs.in_progress ?? cs.inProgress ?? 0), color: '#F97316' },
        { name: 'On Hold', value: Number(cs.on_hold ?? cs.onHold ?? 0), color: '#F59E0B' },
        { name: 'Closed', value: Number(cs.closed ?? cs.Closed ?? 0), color: '#22C55E' },
      ]);

      // Recent Complaints (show last 5)
      const complaints = recentComplaintsData || [];
      const sortedComplaints = complaints
        .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
        .slice(0, 5);
      setRecentComplaints(sortedComplaints);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const profitLoss = parseFloat(stats.transactions?.total_income ?? 0) - parseFloat(stats.transactions?.total_expense ?? 0);

  // Helper functions for status/priority/source colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'on_hold': return 'bg-yellow-500 text-white';
      case 'closed': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'internal': return 'text-blue-600 bg-blue-100';
      case 'external': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={stats.customers.total ?? 0}
          subtitle={`${stats.customers.active ?? 0} active`}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Connections"
          value={stats.connections.total ?? 0}
          subtitle={`${stats.connections.pending ?? 0} pending`}
          icon="🔌"
          color="green"
        />
        <StatCard
          title="Revenue"
          value={`RS ${parseFloat(stats.recharges?.total_paid ?? 0).toFixed(2)}`}
          subtitle={`RS ${parseFloat(stats.recharges?.total_pending ?? 0).toFixed(2)} pending`}
          icon="💰"
          color="yellow"
        />
        <StatCard
          title="Profit/Loss"
          value={`RS ${profitLoss.toFixed(2)}`}
          subtitle={`Income: RS ${parseFloat(stats.transactions?.total_income ?? 0).toFixed(2)}`}
          icon="📊"
          color={profitLoss >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Stock Overview</h2>
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-semibold">{stats.stock.total_items ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span className="font-semibold">RS {parseFloat(stats.stock?.total_value ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Income:</span>
                <span className="font-semibold text-green-600">
                  RS {parseFloat(stats.transactions?.total_income ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Expenses:</span>
                <span className="font-semibold text-red-600">
                  RS {parseFloat(stats.transactions?.total_expense ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span>Net Profit:</span>
                <span className={`font-semibold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  RS {profitLoss.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Growth</h2>
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-500">Total earnings over the last 12 months</p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                Last 12 Months
              </button>
            </div>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Revenue (RS)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <p className="text-lg font-medium">No revenue data available</p>
                  <p className="text-sm mt-2">Revenue data will appear here once transactions are recorded</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Complaint Status</h2>
          <div className="border-t border-gray-200 pt-4">
            <div className="mb-4">
              <p className="text-sm text-gray-500">Current ticketing workload</p>
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={complaintData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {complaintData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {complaintData.map((item, index) => {
                const total = complaintData.reduce((sum, d) => sum + d.value, 0);
                const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-2" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {item.value} ({percentage}%)
                    </span>
                  </div>
                );
              })}
              <div className="pt-2 border-t mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">TOTAL</span>
                  <span className="text-sm font-bold text-gray-900">
                    {complaintData.reduce((sum, d) => sum + d.value, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Complaints Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">📋 Recent Complaints</h2>
          <Link 
            to="/complaints-dashboard" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentComplaints.length > 0 ? (
                recentComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{complaint.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">💬 {complaint.whatsapp_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{complaint.title || 'No Title'}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {complaint.description?.substring(0, 60)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                        {complaint.status || 'open'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority || 'medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(complaint.createdAt || complaint.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No recent complaints found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`${colorClasses[color]} rounded-full p-3 text-white text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;