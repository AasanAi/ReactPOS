// src/components/SalesReport.jsx
import React, { useState } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { utils, writeFile } from 'xlsx';
import { FaTrashAlt } from 'react-icons/fa';

// --- UPDATED ReceiptContent Component to match POS receipt ---
function ReceiptContent({ data }) {
  if (!data) return null;

  // Helper functions for calculations (same as in POS ModernReceipt)
  const calculateSubtotal = (items) => items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculateTotalItemDiscount = (items) => items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);

  const subtotal = calculateSubtotal(data.items || []);
  const totalItemDiscount = calculateTotalItemDiscount(data.items || []);
  const additionalDiscount = data.additionalDiscount || 0;
  const finalSubtotal = subtotal - totalItemDiscount; // Subtotal after item discounts
  const finalGrandTotal = finalSubtotal - additionalDiscount;
  const change = data.amountPaid - finalGrandTotal;

  return (
    <div className="p-6 font-mono text-sm text-black bg-white">
      <h2 className="text-center text-xl font-bold mb-2">Aasan POS</h2>
      <p className="text-center">Sale Invoice</p>
      <hr className="my-3 border-dashed border-black" />
      <div className="space-y-1">
        <p><strong>Sale ID:</strong> {data.id}</p>
        <p><strong>Date:</strong> {new Date(data.date).toLocaleString()}</p>
        <p><strong>Customer:</strong> {data.customerName || 'Walk-in'}</p>
      </div>
      <hr className="my-3 border-dashed border-black" />

      {/* --- UPDATED TABLE: Show item discount if any --- */}
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left font-bold">Item</th>
            <th className="text-right font-bold">Qty</th>
            <th className="text-right font-bold">Price</th>
            {/* Show discount column only if any item has discount */}
            {data.items && data.items.some(item => item.discount > 0) && (
              <th className="text-right font-bold">Disc/Item</th>
            )}
            <th className="text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {(data.items || []).map((item, index) => {
            const itemTotal = (item.price - (item.discount || 0)) * item.quantity;
            return (
              <tr key={item.barcode || index}>
                <td>{item.name}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{(item.price || 0).toFixed(2)}</td>
                {/* Show item discount if any */}
                {data.items && data.items.some(i => i.discount > 0) && (
                  <td className="text-right text-red-500">-{(item.discount || 0).toFixed(2)}</td>
                )}
                <td className="text-right">{itemTotal.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <hr className="my-3 border-dashed border-black" />

      {/* --- UPDATED SUMMARY: Show all discount types --- */}
      <div className="space-y-1 text-xs mt-2">
        <p className="flex justify-between">
          <strong>Subtotal:</strong>
          <span>PKR {subtotal.toFixed(2)}</span>
        </p>
        {/* Show item discounts if any */}
        {totalItemDiscount > 0 && (
          <p className="flex justify-between text-red-600">
            <strong>Item Discounts:</strong>
            <span>- PKR {totalItemDiscount.toFixed(2)}</span>
          </p>
        )}
        {/* Show additional discount if any */}
        {additionalDiscount > 0 && (
          <p className="flex justify-between text-red-600">
            <strong>Additional Discount:</strong>
            <span>- PKR {additionalDiscount.toFixed(2)}</span>
          </p>
        )}
        <p className="flex justify-between font-bold text-base">
          <strong>Grand Total:</strong>
          <span>PKR {finalGrandTotal.toFixed(2)}</span>
        </p>
        <p className="flex justify-between">
          <strong>Amount Paid:</strong>
          <span>PKR {(data.amountPaid || 0).toFixed(2)}</span>
        </p>
        <p className="flex justify-between font-semibold">
          <strong>Change:</strong>
          <span>PKR {change > 0 ? change.toFixed(2) : '0.00'}</span>
        </p>
      </div>

      <div className="text-center mt-4 pt-2 border-t border-dashed border-black text-xs">
        <p>Thank you for your business!</p>
        <p className="font-semibold">Powered by Saleem Ullah</p>
        <p>WhatsApp: 0333-7304781</p>
      </div>
    </div>
  );
}
// --- END UPDATED ReceiptContent Component ---

function SalesReport({ salesHistory, onDeleteSale, onDeleteFilteredSales }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // Options: 'all', 'today', 'thisWeek', 'thisMonth'
  const [selectedSale, setSelectedSale] = useState(null);

  if (!salesHistory) {
    return <div className="text-center p-10 dark:text-gray-400">Loading sales report...</div>;
  }

  const filteredSales = salesHistory
    .filter(sale => {
      const saleDate = new Date(sale.date);
      const now = new Date();
      if (filter === "today") {
        return saleDate.toDateString() === now.toDateString();
      }
      if (filter === "thisWeek") {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return saleDate >= startOfWeek;
      }
      if (filter === "thisMonth") {
        return (
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      }
      // Default: 'all'
      return true;
    })
    .filter(sale =>
      (sale.id ? sale.id.toString().toLowerCase() : '').includes(searchTerm.toLowerCase())
    );

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

  // --- UPDATED exportCSV to include discount info ---
  const exportCSV = (data) => {
    if (!data || data.length === 0) {
      toast.error("No data to export.");
      return;
    }
    // Calculate total discount for each sale
    const enrichedData = data.map(sale => {
      const items = sale.items || [];
      const totalItemDiscount = items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
      const additionalDiscount = sale.additionalDiscount || 0;
      const totalDiscount = totalItemDiscount + additionalDiscount;
      return { ...sale, totalDiscount };
    });

    const headers = ['Sale ID', 'Date', 'Customer', 'Payment Type', 'Subtotal', 'Total Discount', 'Grand Total', 'Amount Paid', 'Profit'];
    const csvData = enrichedData.map(sale => [
      sale.id,
      new Date(sale.date).toLocaleString(),
      sale.customerName || 'Walk-in',
      sale.paymentType || 'N/A',
      (sale.totalAmount || 0).toFixed(2), // Subtotal (before any discount)
      (sale.totalDiscount || 0).toFixed(2), // Total Discount
      ((sale.totalAmount || 0) - (sale.totalDiscount || 0)).toFixed(2), // Grand Total
      (sale.amountPaid || 0).toFixed(2),
      (sale.totalProfit || 0).toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...csvData.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();
  };

  // --- UPDATED exportExcel to include discount info ---
  const exportExcel = (data) => {
    if (!data || data.length === 0) {
      toast.error("No data to export.");
      return;
    }
    // Calculate total discount for each sale
    const enrichedData = data.map(sale => {
      const items = sale.items || [];
      const totalItemDiscount = items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
      const additionalDiscount = sale.additionalDiscount || 0;
      const totalDiscount = totalItemDiscount + additionalDiscount;
      const grandTotal = (sale.totalAmount || 0) - totalDiscount;
      return { ...sale, totalDiscount, grandTotal };
    });

    const worksheet = utils.json_to_sheet(
      enrichedData.map(sale => ({
        "Sale ID": sale.id,
        "Date": new Date(sale.date).toLocaleString(),
        "Customer": sale.customerName || 'Walk-in',
        "Payment Type": sale.paymentType || 'N/A',
        "Subtotal": (sale.totalAmount || 0).toFixed(2),
        "Total Discount": (sale.totalDiscount || 0).toFixed(2),
        "Grand Total": (sale.grandTotal || 0).toFixed(2),
        "Amount Paid": (sale.amountPaid || 0).toFixed(2),
        "Profit": (sale.totalProfit || 0).toFixed(2),
      }))
    );
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Sales Report");
    writeFile(workbook, `sales_report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Sales Report</h2>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by Sale ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => exportCSV(filteredSales)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportExcel(filteredSales)}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Export Excel
            </button>
            <button
              onClick={handleDeleteFiltered}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <FaTrashAlt />Delete Filtered
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
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Subtotal</th>
                {/* --- NEW COLUMN: Total Discount --- */}
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Discount</th>
                {/* --- END NEW COLUMN --- */}
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Total</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Paid</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Profit</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  // --- Calculate discount for table display ---
                  const items = sale.items || [];
                  const totalItemDiscount = items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
                  const additionalDiscount = sale.additionalDiscount || 0;
                  const totalDiscount = totalItemDiscount + additionalDiscount;
                  const grandTotal = (sale.totalAmount || 0) - totalDiscount;
                  // --- END Calculate discount ---

                  return (
                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{sale.id}</td>
                      <td className="px-4 py-3">{new Date(sale.date).toLocaleString()}</td>
                      <td className="px-4 py-3">{sale.customerName || 'Walk-in'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${sale.paymentType === 'Credit' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                          {sale.paymentType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">PKR {(sale.totalAmount || 0).toFixed(2)}</td>
                      {/* --- NEW CELL: Total Discount --- */}
                      <td className="px-4 py-3 text-right text-red-500">PKR {totalDiscount.toFixed(2)}</td>
                      {/* --- END NEW CELL --- */}
                      <td className="px-4 py-3 text-right font-semibold">PKR {grandTotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">PKR {(sale.amountPaid || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">PKR {(sale.totalProfit || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 text-xs rounded-md transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to permanently delete this sale?')) onDeleteSale(sale.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-md transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-gray-500">
                    No sales found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!selectedSale}
        onRequestClose={() => setSelectedSale(null)}
        contentLabel="Sale Receipt Modal"
        className="bg-white rounded-lg shadow-xl p-0 w-full max-w-sm mx-auto mt-12"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"
      >
        {selectedSale && (
          <div className="printable-receipt">
            <div id="printable-receipt-report">
              {/* Use the updated ReceiptContent component */}
              <ReceiptContent data={selectedSale} />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-b-lg flex justify-end gap-2">
              <button
                onClick={handlePrintReceipt}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Print
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="bg-gray-500 text-white px-8 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SalesReport;
