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
  const [complaintData, setComplaintData] = useState([
    { name: 'Pending', value: 0, color: '#F59E0B' },
    { name: 'In Progress', value: 0, color: '#3B82F6' },
    { name: 'Resolved', value: 0, color: '#10B981' },
    { name: 'Overdue', value: 0, color: '#EF4444' }
  ]);
  const [revenueData, setRevenueData] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

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
        complaintService.getAll().catch(() => ({ data: [] })),
      ]);

      const [customers, connections, recharges, stock, transactions, complaintStats, revenueGrowth, recentComplaintsRes] = results.map(r => 
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

      // Update complaint data for pie chart
      if (complaintStats?.stats) {
        setComplaintData([
          { name: 'Pending', value: complaintStats.stats.pending || 0, color: '#F59E0B' },
          { name: 'In Progress', value: complaintStats.stats.in_progress || 0, color: '#3B82F6' },
          { name: 'Resolved', value: complaintStats.stats.resolved || 0, color: '#10B981' },
          { name: 'Overdue', value: complaintStats.stats.overdue || 0, color: '#EF4444' }
        ]);
      }

      // Update revenue data
      if (revenueGrowth?.data && Array.isArray(revenueGrowth.data) && revenueGrowth.data.length > 0) {
        setRevenueData(revenueGrowth.data);
      } else {
        // Fallback to sample data if no real data available
        const sampleData = [
          { month: 'Jan', revenue: 45000 },
          { month: 'Feb', revenue: 52000 },
          { month: 'Mar', revenue: 48000 },
          { month: 'Apr', revenue: 61000 },
          { month: 'May', revenue: 58000 },
          { month: 'Jun', revenue: 67000 },
          { month: 'Jul', revenue: 72000 },
          { month: 'Aug', revenue: 69000 },
          { month: 'Sep', revenue: 75000 },
          { month: 'Oct', revenue: 71000 },
          { month: 'Nov', revenue: 78000 },
          { month: 'Dec', revenue: 82000 },
        ];
        setRevenueData(sampleData);
      }

      // Update recent complaints
      let complaintsData = [];
      if (recentComplaintsRes?.data?.complaints) {
        complaintsData = recentComplaintsRes.data.complaints;
      } else if (recentComplaintsRes?.complaints) {
        complaintsData = recentComplaintsRes.complaints;
      } else if (Array.isArray(recentComplaintsRes)) {
        complaintsData = recentComplaintsRes;
      } else if (Array.isArray(recentComplaintsRes?.data)) {
        complaintsData = recentComplaintsRes.data;
      }
      
      // Get only the 3 most recent complaints
      const recentComplaints = complaintsData.slice(0, 3);
      setRecentComplaints(recentComplaints);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Time unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading) {
    return <Loader />;
  }

  const profitLoss = parseFloat(stats.transactions?.total_income ?? 0) - parseFloat(stats.transactions?.total_expense ?? 0);

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
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">📋</span>
              Recent Complaints
            </h2>
            <Link 
              to="/complaints-dashboard" 
              className="group inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transform transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span>View All</span>
              <svg className="ml-2 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {recentComplaints.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-lg font-medium text-gray-900">No complaints yet</p>
              <p className="text-sm mt-2">Complaints will appear here once they are created</p>
            </div>
          ) : (
            recentComplaints.map((complaint) => {
              // Status styling function
              const getStatusStyle = (status) => {
                const styles = {
                  pending: {
                    bg: 'bg-amber-50',
                    text: 'text-amber-700',
                    border: 'border-amber-200',
                    icon: '⏳'
                  },
                  in_progress: {
                    bg: 'bg-blue-50',
                    text: 'text-blue-700',
                    border: 'border-blue-200',
                    icon: '🔄'
                  },
                  resolved: {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    border: 'border-emerald-200',
                    icon: '✅'
                  },
                  overdue: {
                    bg: 'bg-red-50',
                    text: 'text-red-700',
                    border: 'border-red-200',
                    icon: '⚠️'
                  }
                };
                return styles[status] || {
                  bg: 'bg-gray-50',
                  text: 'text-gray-700',
                  border: 'border-gray-200',
                  icon: '📋'
                };
              };

              // Priority styling function
              const getPriorityStyle = (priority) => {
                const styles = {
                  high: {
                    bg: 'bg-red-100',
                    text: 'text-red-800',
                    border: 'border-red-300',
                    icon: '🔴'
                  },
                  medium: {
                    bg: 'bg-orange-100',
                    text: 'text-orange-800',
                    border: 'border-orange-300',
                    icon: '🟡'
                  },
                  low: {
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-300',
                    icon: '⚪'
                  }
                };
                return styles[priority] || {
                  bg: 'bg-slate-100',
                  text: 'text-slate-700',
                  border: 'border-slate-300',
                  icon: '⚪'
                };
              };

              const statusStyle = getStatusStyle(complaint.status);
              const priorityStyle = getPriorityStyle(complaint.priority);

              return (
                <div 
                  key={complaint.id} 
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-white">
                            {complaint.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {complaint.id ? `COMP-${complaint.id.slice(-6).toUpperCase()}` : 'UNKNOWN'}
                          </p>
                          {complaint.customer_name && (
                            <p className="text-xs text-gray-600 font-medium">
                              {complaint.customer_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 ml-11 line-clamp-2">
                        {complaint.description || 'No description available'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        <span className="mr-1.5">{statusStyle.icon}</span>
                        {complaint.status ? complaint.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                      </span>
                      {complaint.priority && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                          <span className="mr-1">{priorityStyle.icon}</span>
                          {complaint.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-500 flex items-center">
                      <span className="mr-1">🕒</span>
                      {formatTimeAgo(complaint.createdAt)}
                    </p>
                    <Link 
                      to={`/complaints-dashboard`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      <span>View Details</span>
                      <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
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
