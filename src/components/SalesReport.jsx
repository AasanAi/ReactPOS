// src/components/SalesReport.jsx

import React, { useState, useMemo } from 'react';
import { FiCalendar, FiDollarSign, FiPackage, FiPercent, FiTrash2, FiEye, FiDownload } from 'react-icons/fi';
import Modal from 'react-modal';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast'; // === YEH HAI ASAL FIX ===

// Receipt component ko yahan locally define kar dete hain
const ModernReceipt = ({ sale, businessInfo }) => {
  if (!sale) return null;
  const subtotal = sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItemDiscount = sale.items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
  const additionalDiscount = sale.additionalDiscount || 0;
  const finalGrandTotal = subtotal - totalItemDiscount - additionalDiscount;

  return (
    <div className="bg-white text-gray-800 font-sans p-6 w-[320px]">
      <div className="text-center mb-4">
        {businessInfo?.logo && <img src={businessInfo.logo} alt="Shop Logo" className="mx-auto h-16 w-auto object-contain mb-2" />}
        <h1 className="text-2xl font-bold text-gray-900">{businessInfo?.name || 'Aasan POS'}</h1>
        <p className="text-xs text-gray-500">{businessInfo?.address || ''}</p>
        <p className="text-xs text-gray-500">{businessInfo?.phone || ''}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 text-xs mb-4 pb-2 border-b border-dashed">
        <div><strong>Inv #:</strong> {sale.id.toString().slice(-6).toUpperCase()}</div>
        <div className="text-right"><strong>Date:</strong> {new Date(sale.date).toLocaleDateString('en-GB')}</div>
        <div><strong>Customer:</strong></div>
        <div className="text-right">{sale.customerName || 'Walk-in Customer'}</div>
      </div>
      <table className="w-full text-xs mb-4">
        <thead><tr className="border-b"><th className="text-left font-semibold py-2">ITEM</th><th className="text-center font-semibold">QTY</th><th className="text-right font-semibold">PRICE</th><th className="text-right font-semibold">DISC</th><th className="text-right font-semibold">TOTAL</th></tr></thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={index} className="border-b border-gray-100"><td className="py-2">{item.name}</td><td className="text-center">{item.quantity}</td><td className="text-right">{(item.price || 0).toFixed(2)}</td><td className="text-right text-red-500">{(item.discount || 0).toFixed(2)}</td><td className="text-right font-medium">{(((item.price || 0) - (item.discount || 0)) * item.quantity).toFixed(2)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span>Subtotal:</span><span>PKR {subtotal.toFixed(2)}</span></div>
        {totalItemDiscount > 0 && (<div className="flex justify-between"><span>Item Discounts:</span><span className="text-red-500">- PKR {totalItemDiscount.toFixed(2)}</span></div>)}
        {additionalDiscount > 0 && (<div className="flex justify-between"><span>Additional Discount:</span><span className="text-red-500">- PKR {additionalDiscount.toFixed(2)}</span></div>)}
        <div className="flex justify-between text-base font-bold pt-2 border-t mt-2"><span>Grand Total:</span><span>PKR {finalGrandTotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span>Amount Paid:</span><span>PKR {sale.amountPaid.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm font-semibold"><span>Change:</span><span>PKR {(sale.change || 0).toFixed(2)}</span></div>
      </div>
    </div>
  );
};

function SalesReport({ salesHistory, onDeleteSale, onDeleteFilteredSales, shopName, shopAddress, shopPhone, shopLogo }) {
  const [filter, setFilter] = useState('today');
  const [selectedSale, setSelectedSale] = useState(null);

  const filteredSales = useMemo(() => {
    if (!salesHistory) return [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (filter) {
      case 'today': return salesHistory.filter(sale => new Date(sale.date) >= today);
      case 'week': const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay()); return salesHistory.filter(sale => new Date(sale.date) >= startOfWeek);
      case 'month': const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); return salesHistory.filter(sale => new Date(sale.date) >= startOfMonth);
      default: return salesHistory;
    }
  }, [salesHistory, filter]);
  
  const summaryStats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);
    const totalTransactions = filteredSales.length;
    const totalItemsSold = filteredSales.reduce((sum, sale) => sum + (sale.items?.reduce((iSum, i) => iSum + i.quantity, 0) || 0), 0);
    return { totalRevenue, totalProfit, totalTransactions, totalItemsSold };
  }, [filteredSales]);

  const handleExport = () => {
    if (!filteredSales || filteredSales.length === 0) {
      toast.error("No data to export for this period.");
      return;
    }
    const dataToExport = filteredSales.map(sale => ({
      Date: new Date(sale.date).toLocaleString(),
      Customer: sale.customerName || 'Walk-in',
      'Total Items': sale.items.length,
      'Total Amount (PKR)': (sale.totalAmount || 0).toFixed(2),
      'Total Discount (PKR)': (sale.totalDiscount || 0).toFixed(2),
      'Net Sale (PKR)': ((sale.totalAmount || 0) - (sale.totalDiscount || 0)).toFixed(2),
      'Total Profit (PKR)': (sale.totalProfit || 0).toFixed(2),
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
    XLSX.writeFile(workbook, `SalesReport_${filter}.xlsx`);
  };

  const StatCard = ({ icon, title, value, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-4 border-l-4 ${color}`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  );

  const FilterButton = ({ label, value }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
        filter === value 
        ? 'bg-teal-600 text-white shadow' 
        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Sales Report</h2>
      <div className="flex flex-wrap gap-2 mb-6 p-2 bg-gray-200 dark:bg-gray-900 rounded-lg">
        <FilterButton label="Today" value="today" />
        <FilterButton label="This Week" value="week" />
        <FilterButton label="This Month" value="month" />
        <FilterButton label="All Time" value="all" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<FiDollarSign className="text-green-500"/>} title="Total Sales" value={`PKR ${summaryStats.totalRevenue.toFixed(2)}`} color="border-green-500"/>
        <StatCard icon={<FiPercent className="text-blue-500"/>} title="Total Profit" value={`PKR ${summaryStats.totalProfit.toFixed(2)}`} color="border-blue-500"/>
        <StatCard icon={<FiCalendar className="text-purple-500"/>} title="Transactions" value={summaryStats.totalTransactions} color="border-purple-500"/>
        <StatCard icon={<FiPackage className="text-orange-500"/>} title="Items Sold" value={summaryStats.totalItemsSold} color="border-orange-500"/>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Sales Details ({filter.charAt(0).toUpperCase() + filter.slice(1)})</h3>
          <div className="flex space-x-2">
            <button onClick={handleExport} disabled={filteredSales.length === 0} className="bg-green-500 text-white px-3 py-1 rounded-lg flex items-center space-x-2 text-xs hover:bg-green-600 disabled:bg-green-300"><FiDownload /><span>Export</span></button>
            <button onClick={() => { if (window.confirm(`Delete all ${filteredSales.length} displayed sales?`)) { onDeleteFilteredSales(filteredSales); } }} disabled={filteredSales.length === 0} className="bg-red-500 text-white px-3 py-1 rounded-lg flex items-center space-x-2 text-xs hover:bg-red-600 disabled:bg-red-300"><FiTrash2 /><span>Delete Displayed</span></button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Discount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 text-green-600">Profit</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 dark:text-gray-300 whitespace-nowrap">{new Date(sale.date).toLocaleString()}</td>
                  <td className="px-4 py-3 dark:text-gray-300">{sale.customerName || 'Walk-in'}</td>
                  <td className="px-4 py-3 dark:text-gray-300">PKR {(sale.totalAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-red-500">PKR {(sale.totalDiscount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">PKR {(sale.totalProfit || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button onClick={() => setSelectedSale(sale)} className="text-blue-500 hover:text-blue-700" title="View Receipt"><FiEye /></button>
                    <button onClick={() => {if(window.confirm("Are you sure?")) {onDeleteSale(sale.id)}}} className="text-red-500 hover:text-red-700" title="Delete Sale"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && <p className="text-center text-gray-500 py-16">No sales found for this period.</p>}
      </div>
      
      <Modal isOpen={!!selectedSale} onRequestClose={() => setSelectedSale(null)} className="bg-transparent" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {selectedSale && <ModernReceipt sale={selectedSale} businessInfo={{ name: shopName, address: shopAddress, phone: shopPhone, logo: shopLogo }} />}
      </Modal>
    </div>
  );
}

export default SalesReport;