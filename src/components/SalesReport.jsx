import React, { useState } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { utils, writeFile } from 'xlsx';
import { FaTrashAlt } from 'react-icons/fa'; // Delete icon ke liye

// Receipt Content Component (Pehle jaisa hi)
function ReceiptContent({ data }) { /* ... */ }

function SalesReport({ salesHistory, onDeleteSale, onDeleteFilteredSales }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSale, setSelectedSale] = useState(null);

  if (!salesHistory) {
    return <div className="text-center p-10 dark:text-gray-400">Loading sales report...</div>;
  }

  const filteredSales = salesHistory
    .filter(sale => {
      if (filter === "all") return true;
      const saleDate = new Date(sale.date);
      const now = new Date();
      if (filter === "today") return saleDate.toDateString() === now.toDateString();
      return true;
    })
    .filter(sale => (sale.id ? sale.id.toString().toLowerCase() : '').includes(searchTerm.toLowerCase()));

  const handleDeleteFiltered = () => {
    if (filteredSales.length === 0) {
        return toast.error("There are no sales to delete in the current filter.");
    }
    if (window.confirm(`Are you sure you want to delete all ${filteredSales.length} currently filtered sales? This action cannot be undone.`)) {
        const confirmationText = "DELETE";
        const userInput = prompt(`To confirm, please type "${confirmationText}"`);
        if (userInput === confirmationText) {
            onDeleteFilteredSales(filteredSales);
        } else {
            toast.error("Confirmation text did not match. Deletion cancelled.");
        }
    }
  };

  const exportCSV = (data) => { /* ... */ };
  const exportExcel = (data) => { /* ... */ };
  const handlePrintReceipt = () => window.print();
  const generateReceiptHTML = (data) => { /* ... */ };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Sales Report</h2>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input type="text" placeholder="Search by Sale ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-auto bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full sm:w-auto bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="all">All Time</option>
              <option value="today">Today</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportCSV(filteredSales)} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Export CSV</button>
            <button onClick={() => exportExcel(filteredSales)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Export Excel</button>
            {/* NAYA DELETE BUTTON */}
            <button onClick={handleDeleteFiltered} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <FaTrashAlt />
              Delete Filtered
            </button>
          </div>
        </div>

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
                      {/* NAYA INDIVIDUAL DELETE BUTTON */}
                      <button onClick={() => {if(window.confirm('Delete this sale permanently?')) onDeleteSale(sale.id)}} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-md transition-colors">Delete</button>
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
      <Modal isOpen={!!selectedSale} onRequestClose={() => setSelectedSale(null)} contentLabel="Sale Receipt Modal" className="bg-white rounded-lg shadow-xl p-0 w-full max-w-sm mx-auto mt-12" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        {selectedSale && (
          <div className="printable-receipt">
            {/* ... Receipt Modal ka poora JSX bilkul waisa hi rahega ... */}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SalesReport;