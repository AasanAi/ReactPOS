// src/components/SalesReport.jsx

import React, { useState, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { utils, writeFile } from 'xlsx';
import { FaTrashAlt } from 'react-icons/fa';
import { FiPrinter, FiDownload, FiX } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import ModernReceipt from './ModernReceipt'; // Make sure this path is correct

// Set the app element for react-modal to avoid screen reader issues
Modal.setAppElement('#root');

function SalesReport({ salesHistory, onDeleteSale, onDeleteFilteredSales }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSale, setSelectedSale] = useState(null);
  const receiptRef = useRef();

  // Define the print handler hook at the top level
  const handlePrintReceipt = useReactTo-print({
    content: () => receiptRef.current,
    // This function runs after printing is done or cancelled
    onAfterPrint: () => toast('Printing process finished.', { icon: '📄' }),
  });

  if (!salesHistory) {
    return <div className="text-center p-10 dark:text-gray-400">Loading sales report...</div>;
  }

  // --- Data Filtering Logic ---
  const filteredSales = salesHistory
    .filter(sale => {
      if (!sale.date) return false;
      const saleDate = new Date(sale.date);
      const now = new Date();
      if (filter === "today") {
        return saleDate.toDateString() === now.toDateString();
      }
      return true; // "all" case
    })
    .filter(sale =>
      (sale.id ? sale.id.toString().toLowerCase() : '').includes(searchTerm.toLowerCase())
    );
  
  // --- Bulk Delete Logic ---
  const handleDeleteFiltered = () => {
    if (filteredSales.length === 0) {
      return toast.error("There are no sales to delete in the current filter.");
    }
    if (window.confirm(`Are you sure you want to delete all ${filteredSales.length} currently filtered sales? This action cannot be undone.`)) {
      const confirmationText = "DELETE";
      const userInput = prompt(`To confirm, please type "${confirmationText}"`);
      if (userInput === confirmationText) {
        onDeleteFilteredSales(filteredSales);
      } else if (userInput !== null) { // User didn't just cancel the prompt
        toast.error("Confirmation text did not match. Deletion cancelled.");
      }
    }
  };

  // --- Export Logic (CSV & Excel) ---
  const exportToExcel = (data) => {
    if (!data || data.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const worksheetData = data.map(sale => ({
      "Sale ID": sale.id,
      "Date": new Date(sale.date).toLocaleString(),
      "Customer": sale.customerName || 'Walk-in',
      "Payment Type": sale.paymentType || 'N/A',
      "Total Amount": sale.totalAmount || 0,
      "Amount Paid": sale.amountPaid || 0,
      "Profit": sale.totalProfit || 0,
    }));
    const worksheet = utils.json_to_sheet(worksheetData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Sales Report");
    writeFile(workbook, `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- Receipt Download as Image Logic ---
  const handleDownloadImage = () => {
    const receiptElement = receiptRef.current;
    if (!receiptElement) return;

    toast.loading('Generating Image...', { id: 'download-toast' });
    html2canvas(receiptElement, {
      scale: 3, // Higher scale for better quality
      useCORS: true, // Important for external resources if any
      backgroundColor: '#ffffff',
    }).then((canvas) => {
      const link = document.createElement('a');
      link.download = `receipt-${selectedSale.id}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('Image downloaded!', { id: 'download-toast' });
    }).catch(err => {
      toast.error('Could not generate image.', { id: 'download-toast' });
      console.error("html2canvas error:", err);
    });
  };

  // --- Business Info for Receipt ---
  const businessInfo = {
    name: "Baber Market Landhi no 3 1/2",
    address: "Super Market, Karachi",
    phone: "0321-3630916, 0300-2559902",
    owner: "Saleem Ullah",
    whatsapp: "0333-7304781"
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Sales Report</h2>
        {/* --- Controls: Search, Filter, Export --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
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
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Sale ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Payment</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Total</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Paid</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Profit</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
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

      {/* --- Receipt Modal --- */}
      <Modal
        isOpen={!!selectedSale}
        onRequestClose={() => setSelectedSale(null)}
        contentLabel="Sale Receipt Modal"
        className="modal-content" // Custom class for styling
        overlayClassName="modal-overlay" // Custom class for styling
      >
        {selectedSale && (
          <div className="bg-gray-100 p-4 rounded-lg shadow-xl relative w-auto">
            {/* The ref is attached to the component that will be printed */}
            <ModernReceipt ref={receiptRef} sale={selectedSale} businessInfo={businessInfo} />
            
            <div className="flex justify-center gap-4 mt-4 print:hidden">
              <button onClick={handlePrintReceipt} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"><FiPrinter /> Print</button>
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