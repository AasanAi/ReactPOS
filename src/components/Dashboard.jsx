import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function Dashboard({ products, salesHistory }) {
  const [salesData, setSalesData] = useState({ labels: [], datasets: [] });
  const [topProductsData, setTopProductsData] = useState({ labels: [], datasets: [] });

  // Calculate stats for today
  const today = new Date().toDateString();
  const todaysSales = salesHistory.filter(sale => new Date(sale.date).toDateString() === today);
  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const todaysProfit = todaysSales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);
  const todaysTransactions = todaysSales.length;
  const averageSale = todaysTransactions > 0 ? todaysRevenue / todaysTransactions : 0;

  const lowStockProducts = products.filter(p => p.quantity <= 5);

  useEffect(() => {
    // Sales chart data (last 7 days)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();

    const salesByDay = last7Days.map(day => {
      return salesHistory
        .filter(sale => new Date(sale.date).toLocaleDateString('en-US', { weekday: 'short' }) === day)
        .reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    });

    setSalesData({
      labels: last7Days,
      datasets: [{
        label: 'Daily Sales (PKR)',
        data: salesByDay,
        backgroundColor: 'rgba(20, 184, 166, 0.6)',
        borderColor: 'rgba(13, 148, 136, 1)',
        borderWidth: 1,
      }],
    });

    // Top selling products data
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
      }],
    });

  }, [salesHistory]);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Key Metric Cards */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"><h3 className="text-gray-500 dark:text-gray-400">Today's Sale</h3><p className="text-3xl font-bold text-teal-600 dark:text-teal-400">PKR {todaysRevenue.toFixed(2)}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"><h3 className="text-gray-500 dark:text-gray-400">Today's Profit</h3><p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">PKR {todaysProfit.toFixed(2)}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"><h3 className="text-gray-500 dark:text-gray-400">Transactions</h3><p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{todaysTransactions}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"><h3 className="text-gray-500 dark:text-gray-400">Avg. Sale Value</h3><p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">PKR {averageSale.toFixed(2)}</p></div>
        
        {/* Sales Chart */}
        <div className="md:col-span-2 lg:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-2">Sales (Last 7 Days)</h3>
          <Bar options={{ responsive: true }} data={salesData} />
        </div>

        {/* Top Products & Low Stock */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-2">Top Selling Products</h3>
          <div className="max-h-64 mx-auto"><Doughnut data={topProductsData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-2">Low Stock Alerts ({lowStockProducts.length})</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
            {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
              <li key={p.id} className="py-2 flex justify-between items-center">
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