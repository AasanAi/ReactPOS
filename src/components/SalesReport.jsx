// src/components/SalesReport.jsx

import React, { useState, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { utils, writeFile } from 'xlsx';
import { FaTrashAlt } from 'react-icons/fa';
import { FiPrinter, FiDownload, FiX } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import ModernReceipt from './ModernReceipt';

Modal.setAppElement('#root');

function SalesReport({ salesHistory, onDeleteSale, onDeleteFilteredSales }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSale, setSelectedSale] = useState(null);
  
  // --- NAYA AUR SAHI PRINT SETUP ---
  // 1. Ref ab page par chupi hui (hidden) receipt par lagega.
  const printableReceiptRef = useRef(); 

  // 2. Print hook ab is ref ko print karega.
  const handlePrint = useReactToPrint({
    content: () => printableReceiptRef.current,
    documentTitle: `Receipt-${selectedSale?.id || ''}`,
    onAfterPrint: () => toast.success('Printing Done!'),
  });

  if (!salesHistory) {
    return <div className="text-center p-10 dark:text-gray-400">Loading sales report...</div>;
  }

  const filteredSales = salesHistory
    .filter(sale => {
      if (!sale.date) return false;
      const saleDate = new Date(sale.date);
      const now = new Date();
      if (filter === "today") return saleDate.toDateString() === now.toDateString();
      return true;
    })
    .filter(sale => (sale.id ? sale.id.toString().toLowerCase() : '').includes(searchTerm.toLowerCase()));
  
  const handleDeleteFiltered = () => { /* ... existing code, no change ... */ };
  const exportToExcel = (data) => { /* ... existing code, no change ... */ };

  const handleDownloadImage = () => {
    const receiptElement = printableReceiptRef.current;
    if (!receiptElement) return;
    toast.loading('Generating Image...', { id: 'download-toast' });
    html2canvas(receiptElement, { scale: 3, useCORS: true, backgroundColor: '#ffffff' })
      .then((canvas) => {
        const link = document.createElement('a');
        link.download = `receipt-${selectedSale.id}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        toast.success('Image downloaded!', { id: 'download-toast' });
      }).catch(err => { toast.error('Could not generate image.', { id: 'download-toast' }); });
  };

  const businessInfo = {
    name: "Saleem Stationery, address: "Qazafi Town",
    phone: "03182014863", owner: "Saleem Ullah", whatsapp: "0333-7304781"
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* --- NAYA, CHUPA HUA COMPONENT SIRF PRINT KE LIYE --- */}
      <div className="hidden-for-screen">
        <ModernReceipt ref={printableReceiptRef} sale={selectedSale} businessInfo={businessInfo} />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Sales Report</h2>
        {/* --- Controls Section --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            {/* ... search, filter, export buttons ... */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <input type="text" placeholder="Search by Sale ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-auto bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full sm:w-auto bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                </select>
            </div>
            <div className="flex gap-2">
                <button onClick={() => exportToExcel(filteredSales)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Export Excel</button>
                <button onClick={handleDeleteFiltered} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"><FaTrashAlt />Delete Filtered</button>
            </div>
        </div>

        {/* --- Sales Data Table --- */}
        <div className="overflow-x-auto max-h-[70vh]">
            <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                    {/* Table headers */}
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSales.length > 0 ? (
                        filteredSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs">{sale.id}</td>
                            <td className="px-4 py-3">{new Date(sale.date).toLocaleString()}</td>
                            <td className="px-4 py-3">{sale.customerName || 'Walk-in'}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${sale.paymentType === 'Credit' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>{sale.paymentType || 'N/A'}</span></td>
                            <td className="px-4 py-3 text-right font-semibold">PKR {(sale.totalAmount || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">PKR {(sale.amountPaid || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-emerald-600">PKR {(sale.totalProfit || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-center space-x-2">
                                <button onClick={() => setSelectedSale(sale)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 text-xs rounded-md transition-colors">View</button>
                                <button onClick={() => {if(window.confirm('Are you sure you want to permanently delete this sale?')) onDeleteSale(sale.id)}} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-md transition-colors">Delete</button>
                            </td>
                        </tr>
                        ))
                    ) : (
                        <tr><td colSpan="8" className="text-center py-10 text-gray-500">No sales found for this period.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- MODAL SIRF RECEIPT DIKHANE KE LIYE HAI, PRINT KE LIYE NAHI --- */}
      <Modal
        isOpen={!!selectedSale}
        onRequestClose={() => setSelectedSale(null)}
        contentLabel="Sale Receipt Modal"
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        {selectedSale && (
          <div className="bg-gray-100 p-4 rounded-lg shadow-xl relative w-auto">
            {/* Yahan receipt ko ref ki zaroorat nahi */}
            <ModernReceipt sale={selectedSale} businessInfo={businessInfo} />
            
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"><FiPrinter /> Print</button>
              <button onClick={handleDownloadImage} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"><FiDownload /> Download</button>
              <button onClick={() => setSelectedSale(null)} className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"><FiX /> Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SalesReport;