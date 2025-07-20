import React, { useState } from 'react';
import { utils, writeFile } from 'xlsx';

function SalesReport({ salesHistory }) {
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
      if (filter === "today") {
        return saleDate.toDateString() === now.toDateString();
      }
      return true;
    })
    .filter(sale =>
      sale.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

  const exportCSV = (data) => {
    const csvRows = [];
    const headers = ['Sale ID', 'Date', 'Customer', 'Payment Type', 'Total Amount', 'Amount Paid', 'Profit'];
    csvRows.push(headers.join(','));

    data.forEach(sale => {
      const row = [
        sale.id,
        new Date(sale.date).toLocaleString(),
        sale.customerName || 'Walk-in',
        sale.paymentType || '',
        sale.totalAmount || 0,
        sale.amountPaid || 0,
        sale.totalProfit || 0,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = (data) => {
    const worksheet = utils.json_to_sheet(
      data.map(sale => ({
        "Sale ID": sale.id,
        "Date": new Date(sale.date).toLocaleString(),
        "Customer": sale.customerName || 'Walk-in',
        "Payment Type": sale.paymentType || '',
        "Total Amount": sale.totalAmount || 0,
        "Amount Paid": sale.amountPaid || 0,
        "Profit": sale.totalProfit || 0,
      }))
    );
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "SalesReport");
    writeFile(workbook, `sales_report_${Date.now()}.xlsx`);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Sales Report</h2>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by Sale ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-1/3 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => exportCSV(filteredSales)}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded"
          >
            Export CSV
          </button>
          <button
            onClick={() => exportExcel(filteredSales)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded"
          >
            Export Excel
          </button>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">Sale ID</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Profit</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-4 py-3 font-mono text-xs">{sale.id}</td>
                    <td className="px-4 py-3">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-4 py-3">{sale.customerName || 'Walk-in'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${sale.paymentType === 'Credit' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                        {sale.paymentType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">PKR {(sale.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">PKR {(sale.amountPaid || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">PKR {(sale.totalProfit || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 text-xs rounded"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500">No sales found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Receipt - Sale #{selectedSale.id}</h3>
            <p><strong>Date:</strong> {new Date(selectedSale.date).toLocaleString()}</p>
            <p><strong>Customer:</strong> {selectedSale.customerName || 'Walk-in'}</p>
            <p><strong>Payment Type:</strong> {selectedSale.paymentType}</p>
            <p><strong>Total:</strong> PKR {(selectedSale.totalAmount || 0).toFixed(2)}</p>
            <p><strong>Paid:</strong> PKR {(selectedSale.amountPaid || 0).toFixed(2)}</p>
            <p><strong>Profit:</strong> PKR {(selectedSale.totalProfit || 0).toFixed(2)}</p>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => window.print()}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Download / Print
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesReport;
