// src/components/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiPackage, FiUsers, FiShoppingCart } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Chart.js ko register karna zaroori hai
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard({ products, salesHistory, customers }) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  // useEffect ka istemal data calculate karne ke liye
  useEffect(() => {
    if (salesHistory && products && customers) {
      const today = new Date().toISOString().slice(0, 10);

      // Total Revenue
      const totalRevenue = salesHistory.reduce((sum, sale) => sum + sale.totalAmount, 0);

      // Today's Revenue
      const todayRevenue = salesHistory
        .filter(sale => sale.date.slice(0, 10) === today)
        .reduce((sum, sale) => sum + sale.totalAmount, 0);

      // Stats update karein
      setStats({
        totalRevenue,
        todayRevenue,
        totalProducts: products.length,
        totalCustomers: customers.length,
      });

      // Chart ka data tayar karein (pichle 7 din)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().slice(0, 10);
      }).reverse();

      const salesByDay = last7Days.map(day => {
        return salesHistory
          .filter(sale => sale.date.slice(0, 10) === day)
          .reduce((sum, sale) => sum + sale.totalAmount, 0);
      });
      
      setChartData({
        labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [
          {
            label: 'Daily Revenue (PKR)',
            data: salesByDay,
            borderColor: 'rgb(20, 184, 166)', // teal-500
            backgroundColor: 'rgba(20, 184, 166, 0.2)',
            fill: true,
            tension: 0.4
          }
        ]
      });
    }
  }, [salesHistory, products, customers]);

  const StatCard = ({ icon, title, value, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
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
        <StatCard 
          icon={<FiDollarSign size={24} className="text-green-800" />}
          title="Today's Revenue"
          value={`PKR ${stats.todayRevenue.toFixed(2)}`}
          color="bg-green-100 dark:bg-green-900"
        />
        <StatCard 
          icon={<FiShoppingCart size={24} className="text-blue-800" />}
          title="Total Revenue"
          value={`PKR ${stats.totalRevenue.toFixed(2)}`}
          color="bg-blue-100 dark:bg-blue-900"
        />
        <StatCard 
          icon={<FiPackage size={24} className="text-orange-800" />}
          title="Total Products"
          value={stats.totalProducts}
          color="bg-orange-100 dark:bg-orange-900"
        />
        <StatCard 
          icon={<FiUsers size={24} className="text-purple-800" />}
          title="Total Customers"
          value={stats.totalCustomers}
          color="bg-purple-100 dark:bg-purple-900"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Last 7 Days Sales</h3>
        {chartData.labels.length > 0 ? (
          <Line 
            data={chartData} 
            options={{
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Sales Performance' }
                }
            }}
          />
        ) : (
          <p className="text-center text-gray-500 py-8">Not enough data to display chart.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;