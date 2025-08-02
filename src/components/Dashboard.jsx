import React, { useEffect, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { FiTrendingUp, FiDollarSign, FiUsers, FiShoppingCart } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

// Chota sa sub-component, stat cards ke liye
function StatCard({ title, value, icon, colorClass }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
      <div className={`p-3 rounded-full ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

function Dashboard({ products, salesHistory, customers }) {
  const [salesChartData, setSalesChartData] = useState({ labels: [], datasets: [] });
  const [topProductsData, setTopProductsData] = useState({ labels: [], datasets: [] });

  // Stats calculate karna
  const today = new Date().toDateString();
  const todaysSales = salesHistory.filter(sale => new Date(sale.date).toDateString() === today);
  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const todaysProfit = todaysSales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);
  const totalCustomers = customers.length;
  const todaysTransactions = todaysSales.length;

  const lowStockProducts = products.filter(p => p.quantity <= 5);
  const recentSales = [...salesHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  useEffect(() => {
    // Sales chart ka data
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const labels = last7Days.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const data = last7Days.map(day => 
      salesHistory
        .filter(sale => new Date(sale.date).toDateString() === day.toDateString())
        .reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
    );

    setSalesChartData({
      labels,
      datasets: [{
        label: 'Sales (PKR)',
        data,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    });

    // Top products ka data
    const productSales = salesHistory.flatMap(sale => sale.items).reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
      return acc;
    }, {});
    const sortedProducts = Object.entries(productSales).sort(([, a], [, b]) => b - a).slice(0, 5);

    setTopProductsData({
      labels: sortedProducts.map(([name]) => name),
      datasets: [{
        label: 'Quantity Sold',
        data: sortedProducts.map(([, qty]) => qty),
        backgroundColor: ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a'],
        hoverOffset: 4,
        borderWidth: 0,
      }],
    });

  }, [salesHistory]);

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Today's Sale" value={`PKR ${todaysRevenue.toFixed(2)}`} icon={<FiTrendingUp size={24} />} colorClass="bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300" />
        <StatCard title="Today's Profit" value={`PKR ${todaysProfit.toFixed(2)}`} icon={<FiDollarSign size={24} />} colorClass="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300" />
        <StatCard title="Total Customers" value={totalCustomers} icon={<FiUsers size={24} />} colorClass="bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300" />
        <StatCard title="Today's Transactions" value={todaysTransactions} icon={<FiShoppingCart size={24} />} colorClass="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300" />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-2">Sales Overview (Last 7 Days)</h3>
          <div className="h-72"><Line options={{ responsive: true, maintainAspectRatio: false }} data={salesChartData} /></div>
        </div>
        
        {/* Top Products Doughnut Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-2">Top Selling Products</h3>
          <div className="h-72"><Doughnut data={topProductsData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
        </div>
      </div>

      {/* Bottom Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-2">Recent Sales</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentSales.length > 0 ? recentSales.map(sale => (
              <li key={sale.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{sale.customerName || 'Walk-in Customer'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(sale.date).toLocaleTimeString()}</p>
                </div>
                <p className="font-semibold text-gray-700 dark:text-gray-200">PKR {sale.totalAmount.toFixed(2)}</p>
              </li>
            )) : <p className="text-gray-500 dark:text-gray-400 text-center py-10">No sales recorded yet.</p>}
          </ul>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-2">Low Stock Alerts</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
              <li key={p.id} className="py-3 flex justify-between items-center">
                <span className="dark:text-gray-300">{p.name}</span>
                <span className="font-bold text-red-500">{p.quantity} left</span>
              </li>
            )) : <p className="text-gray-500 dark:text-gray-400 text-center py-10">All stock is healthy!</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;