import { useEffect, useState } from 'react';
import { customerService } from '../../services/customerService';
import { connectionService } from '../../services/connectionService';
import { rechargeService } from '../../services/rechargeService';
import { stockService } from '../../services/stockService';
import { transactionService } from '../../services/transactionService';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    customers: { total: 0, active: 0 },
    connections: { total: 0, pending: 0 },
    recharges: { total_paid: 0, total_pending: 0 },
    stock: { total_items: 0, total_value: 0 },
    transactions: { total_income: 0, total_expense: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [customers, connections, recharges, stock, transactions] = await Promise.all([
        customerService.getStats(),
        connectionService.getStats(),
        rechargeService.getStats(),
        stockService.getStats(),
        transactionService.getSummary(),
      ]);

      setStats({
        customers: customers.stats || {},
        connections: connections.stats || {},
        recharges: recharges.stats || {},
        stock: stock.stats || {},
        transactions: transactions.summary || {},
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const profitLoss = (stats.transactions.total_income || 0) - (stats.transactions.total_expense || 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={stats.customers.total || 0}
          subtitle={`${stats.customers.active || 0} active`}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Connections"
          value={stats.connections.total || 0}
          subtitle={`${stats.connections.pending || 0} pending`}
          icon="🔌"
          color="green"
        />
        <StatCard
          title="Revenue"
          value={`$${(stats.recharges.total_paid || 0).toFixed(2)}`}
          subtitle={`$${(stats.recharges.total_pending || 0).toFixed(2)} pending`}
          icon="💰"
          color="yellow"
        />
        <StatCard
          title="Profit/Loss"
          value={`$${profitLoss.toFixed(2)}`}
          subtitle={`Income: $${(stats.transactions.total_income || 0).toFixed(2)}`}
          icon="📊"
          color={profitLoss >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Stock Overview</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Items:</span>
              <span className="font-semibold">{stats.stock.total_items || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Value:</span>
              <span className="font-semibold">${(stats.stock.total_value || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Income:</span>
              <span className="font-semibold text-green-600">
                ${(stats.transactions.total_income || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Expenses:</span>
              <span className="font-semibold text-red-600">
                ${(stats.transactions.total_expense || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span>Net Profit:</span>
              <span className={`font-semibold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${profitLoss.toFixed(2)}
              </span>
            </div>
          </div>
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

