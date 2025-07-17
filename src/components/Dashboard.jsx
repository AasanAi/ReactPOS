import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Dashboard({ products, salesHistory }) {
  // Aaj ke data ke liye calculations
  const todaysSales = useMemo(() => {
    if (!salesHistory) return [];
    const now = new Date();
    return salesHistory.filter(sale => new Date(sale.date).toDateString() === now.toDateString());
  }, [salesHistory]);

  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const todaysProfit = todaysSales.reduce((sum, sale) => sum + sale.totalProfit, 0);

  // Top Selling Products (Aaj ke)
  const topSellingProducts = useMemo(() => {
    const productCount = {};
    todaysSales.forEach(sale => {
      sale.items.forEach(item => {
        if (productCount[item.name]) {
          productCount[item.name] += item.quantity;
        } else {
          productCount[item.name] = item.quantity;
        }
      });
    });
    return Object.entries(productCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [todaysSales]);

  // Low Stock Products
  const lowStockProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.quantity > 0 && p.quantity <= 5);
  }, [products]);
  
  // Weekly sales graph ka logic
  const prepareChartData = () => {
    const labels = []; const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
      const salesForDay = (salesHistory || []).filter(sale => new Date(sale.date).toDateString() === d.toDateString()).reduce((sum, sale) => sum + sale.totalAmount, 0);
      data.push(salesForDay);
    }
    return { labels, datasets: [{ label: 'Sales (PKR)', data, backgroundColor: 'rgba(22, 163, 74, 0.6)', borderColor: 'rgba(22, 163, 74, 1)', borderWidth: 1 }] };
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1"><h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Today's Sale</h3><p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">PKR {todaysRevenue.toFixed(2)}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1"><h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Today's Profit</h3><p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">PKR {todaysProfit.toFixed(2)}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1"><h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Today's Transactions</h3><p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">{todaysSales.length}</p></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Top Selling Today</h3>
          {topSellingProducts.length > 0 ? (
            <ul className="space-y-3">
              {topSellingProducts.map(([name, count]) => (
                <li key={name} className="flex justify-between items-center text-sm border-b pb-2 border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-200">{name}</span>
                  <span className="font-bold text-teal-600 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 px-2 py-1 rounded-full">{count} sold</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sales recorded today.</p>
          )}
        </div>
        
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Low Stock Alerts (5 or less)</h3>
          {lowStockProducts.length > 0 ? (
            <div className="overflow-x-auto max-h-48">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Product Name</th><th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Stock Left</th></tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {lowStockProducts.map(product => (
                    <tr key={product.barcode}>
                      <td className="px-4 py-2 dark:text-gray-200">{product.name}</td>
                      <td className="px-4 py-2 font-bold text-red-500">{product.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">All products have sufficient stock.</p>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Last 7 Days Sales Chart</h3>
        <div className="h-96"><Bar options={{ responsive: true, maintainAspectRatio: false }} data={prepareChartData()} /></div>
      </div>
    </div>
  );
}
export default Dashboard;