// src/components/SalesReport.jsx

import React, { useState, useMemo, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { FiPrinter, FiDownload, FiX } from 'react-icons/fi';
import ModernReceipt from './ModernReceipt'; // Hum naya, behtar receipt component istemal karenge

Modal.setAppElement('#root');

function SalesReport({ salesHistory, onDeleteSale, onDeleteFilteredSales }) { // props ko dobara add kiya
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // --- NAYA PRINT SETUP ---
  const printableReceiptRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => printableReceiptRef.current,
    documentTitle: `Receipt-${selectedSale?.id || ''}`,
  });

  const filteredSales = useMemo(() => {
    if (!salesHistory) return [];
    const now = new Date();
    return salesHistory
      .filter(sale => {
        if (!sale.date) return false;
        const saleDate = new Date(sale.date);
        if (filterPeriod === 'today') return saleDate.toDateString() === now.toDateString();
        if (filterPeriod === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return saleDate >= oneWeekAgo;
        }
        if (filterPeriod === 'month') return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        return true;
      })
      .filter(sale => sale.id.toString().includes(searchTerm));
  }, [salesHistory, filterPeriod, searchTerm]);

  const totalFilteredRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalFilteredProfit = filteredSales.reduce((sum, sale) => sum + sale.totalProfit, 0);
  const totalFilteredTransactions = filteredSales.length;

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

  const exportReportToCSV = () => {
    if (filteredSales.length === 0) {
      toast.error("No sales data to export.");
      return;
    }
    let csvRows = [];
    const headers = ["Sale ID", "Date", "Item Name", "Quantity", "Sale Price", "Discount", "Total Item Price", "Sale Total", "Profit"];
    csvRows.push(headers.join(','));

    for (const sale of filteredSales) {
      for (const item of sale.items) {
        const row = [
          sale.id, new Date(sale.date).toLocaleString(), item.name.replace(/,/g, ''),
          item.quantity, item.price, item.discount || 0,
          (item.price - (item.discount || 0)) * item.quantity,
          sale.totalAmount, ((item.price - (item.discount || 0)) - item.buyPrice) * item.quantity,
        ];
        csvRows.push(row.join(','));
      }
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `AasanPOS_Sales_Report_${filterPeriod}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  
  const handleDownloadImage = () => {
    const receiptElement = printableReceiptRef.current;
    if (!receiptElement) return;
    toast.loading('Generating Image...');
    html2canvas(receiptElement, { scale: 3, useCORS: true, backgroundColor: '#ffffff' })
      .then((canvas) => {
        const link = document.createElement('a');
        link.download = `receipt-${selectedSale.id}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        toast.dismiss(); toast.success('Image downloaded!');
      });
  };

  const businessInfo = {
    name: "Saleem Stationery", address: "Qazafi Town",
    phone: "03182014863", owner: "Saleem Ullah", whatsapp: "0333-7304781"
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* --- NAYA, CHUPA HUA COMPONENT SIRF PRINT/DOWNLOAD KE LIYE --- */}
      <div className="hidden-for-screen">
        <ModernReceipt ref={printableReceiptRef} sale={selectedSale} businessInfo={businessInfo} />
      </div>

      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Sales Report</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow"><h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Total Sale</h3><p className="text-3xl font-bold text-emerald-600 mt-2">PKR {totalFilteredRevenue.toFixed(2)}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow"><h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Total Profit</h3><p className="text-3xl font-bold text-green-600 mt-2">PKR {totalFilteredProfit.toFixed(2)}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow"><h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Transactions</h3><p className="text-3xl font-bold text-blue-600 mt-2">{totalFilteredTransactions}</p></div>
      </div>
      
      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex space-x-2">
          {['all', 'today', 'week', 'month'].map(period => (
            <button key={period} onClick={() => setFilterPeriod(period)} className={`capitalize px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filterPeriod === period ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 hover:bg-gray-300'}`}>
              {period === 'all' ? 'All Time' : period}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <input type="text" placeholder="Search by Sale ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full" />
          <button onClick={exportReportToCSV} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap">Export Report</button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Sale ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Items</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Total Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Profit</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {[...filteredSales].reverse().map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400">{sale.id}</td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-300">{new Date(sale.date).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-300">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">PKR {sale.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">PKR {sale.totalProfit.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleViewDetails(sale)} className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (<p className="text-center text-gray-500 py-8">No sales found for the selected period.</p>)}
      </div>

      {/* Sale Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onRequestClose={() => setIsDetailModalOpen(false)}
        contentLabel="Sale Details"
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        {selectedSale && (
          <div className="bg-gray-100 p-4 rounded-lg shadow-xl relative w-auto">
            <ModernReceipt sale={selectedSale} businessInfo={businessInfo} />
            <div className="flex justify-center gap-4 mt-4 print:hidden">
              <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"><FiPrinter /> Print</button>
              <button onClick={handleDownloadImage} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"><FiDownload /> Download</button>
              <button onClick={() => setIsDetailModalOpen(false)} className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"><FiX /> Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SalesReport;