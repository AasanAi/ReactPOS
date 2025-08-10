// src/components/Dashboard.jsx

import React, { useMemo } from 'react';
import { FiDollarSign, FiPackage, FiUsers, FiShoppingCart, FiAlertTriangle, FiTrendingDown } from 'react-icons/fi';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

function Dashboard({ products, salesHistory, customers }) {
  
  const stats = useMemo(() => {
    if (!salesHistory || !products || !customers) {
      return { totalRevenue: 0, todayRevenue: 0, totalProducts: 0, totalCustomers: 0 };
    }
    const today = new Date().toISOString().slice(0, 10);
    const totalRevenue = salesHistory.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const todayRevenue = salesHistory
      .filter(sale => sale.date && sale.date.slice(0, 10) === today)
      .reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

    return { totalRevenue, todayRevenue, totalProducts: products.length, totalCustomers: customers.length };
  }, [salesHistory, products, customers]);

  const weeklyChartData = useMemo(() => {
    if (!salesHistory) return { labels: [], datasets: [] };
    const last7Days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); }).reverse();
    const salesByDay = last7Days.map(day => salesHistory.filter(sale => sale.date && sale.date.slice(0, 10) === day).reduce((sum, sale) => sum + (sale.totalAmount || 0), 0));
    return {
      labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })),
      datasets: [{ label: 'Daily Revenue (PKR)', data: salesByDay, borderColor: 'rgb(20, 184, 166)', backgroundColor: 'rgba(20, 184, 166, 0.2)', fill: true, tension: 0.4 }]
    };
  }, [salesHistory]);

  const topSellingChartData = useMemo(() => {
    if (!salesHistory) return { labels: [], datasets: [] };
    const itemSales = {};
    salesHistory.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
        });
      }
    });
    const sortedItems = Object.entries(itemSales).sort(([, a], [, b]) => b - a);
    const top5Items = sortedItems.slice(0, 5);
    return {
      labels: top5Items.map(([name]) => name),
      datasets: [{
        label: 'Quantity Sold',
        data: top5Items.map(([, quantity]) => quantity),
        backgroundColor: ['#14b8a6', '#6366f1', '#f97316', '#8b5cf6', '#ec4899'],
        hoverOffset: 4
      }]
    };
  }, [salesHistory]);

  const lowStockProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => (p.quantity || 0) <= 5).sort((a,b) => a.quantity - b.quantity);
  }, [products]);

  const dueStats = useMemo(() => {
    if (!customers) return { totalDue: 0, topDebtors: [] };
    const debtors = customers.filter(c => (c.dueBalance || 0) > 0);
    const totalDue = debtors.reduce((sum, c) => sum + c.dueBalance, 0);
    const topDebtors = debtors.sort((a, b) => b.dueBalance - a.dueBalance).slice(0, 5);
    return { totalDue, topDebtors };
  }, [customers]);

  const StatCard = ({ icon, title, value, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<FiDollarSign size={24} className="text-green-800" />} title="Today's Revenue" value={`PKR ${stats.todayRevenue.toFixed(2)}`} color="bg-green-100 dark:bg-green-900" />
        <StatCard icon={<FiShoppingCart size={24} className="text-blue-800" />} title="Total Revenue" value={`PKR ${stats.totalRevenue.toFixed(2)}`} color="bg-blue-100 dark:bg-blue-900" />
        <StatCard icon={<FiPackage size={24} className="text-orange-800" />} title="Total Products" value={stats.totalProducts} color="bg-orange-100 dark:bg-orange-900" />
        <StatCard icon={<FiUsers size={24} className="text-purple-800" />} title="Total Customers" value={stats.totalCustomers} color="bg-purple-100 dark:bg-purple-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Last 7 Days Sales</h3>
          <div className="h-80">{weeklyChartData.labels.length > 0 ? <Line data={weeklyChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /> : <p className="text-center text-gray-500 pt-20">No sales data for the last 7 days.</p>}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Top 5 Selling Items</h3>
          <div className="h-80 flex justify-center items-center">
            {topSellingChartData.labels.length > 0 ? (
              <Doughnut data={topSellingChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            ) : (
              <p className="text-center text-gray-500">No sales data to show top items.</p>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
            <FiTrendingDown className="text-yellow-500 mr-2" />
            Receivables (Dues) - Total: <span className="ml-2 font-extrabold text-yellow-600">PKR {dueStats.totalDue.toFixed(2)}</span>
          </h3>
          <div className="overflow-x-auto max-h-60">
            {dueStats.topDebtors.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Customer Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Phone</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Due Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dueStats.topDebtors.map(c => (
                    <tr key={c.id}>
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-200 whitespace-nowrap">{c.name}</td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{c.phone}</td>
                      <td className="px-4 py-2 text-right font-bold text-yellow-600">{(c.dueBalance || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-16">No outstanding dues. All clear!</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center"><FiAlertTriangle className="text-red-500 mr-2" />Low Stock Items</h3>
          <div className="overflow-x-auto max-h-60">
            {lowStockProducts.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-gray-800">
                  <tr><th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Product</th><th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Left</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {lowStockProducts.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-200 whitespace-nowrap">{p.name}</td>
                      <td className="px-4 py-2 text-right font-bold text-red-500">{p.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-16">No low stock items. Great job!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;