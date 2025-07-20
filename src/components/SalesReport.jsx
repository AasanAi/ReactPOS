import React, inport { useState } from 'react';

function SalesReport({ salesHistory }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // --- SABSE ZAROORI GUARD ---
  // Agar salesHistory abhi tak load nahi hui ya khaali hai, to crash hone se bachao.
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
      // Yahan week, month, etc. ke liye aur logic add ho sakta hai.
      return true;
    })
    .filter(sale => 
      sale.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Sales Report</h2>
        
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by Sale ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-1/3 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            {/* Week/Month filters can be added here */}
          </select>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Sale ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Payment</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Total Amount</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Amount Paid</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100 font-mono text-xs">{sale.id}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-4 py-3 dark:text-gray-200">{sale.customerName || 'Walk-in'}</td>
                    <td className="px-4 py-3 dark:text-gray-300">
                      <span className={`px-2 py-1 text-xs rounded-full ${sale.paymentType === 'Credit' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                        {sale.paymentType || 'N/A'}
                      </span>
                    </td>
                    {/* --- YEH SARE GUARDS CRASH SE BACHAYENGE --- */}
                    <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-100">PKR {(sale.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right dark:text-gray-300">PKR {(sale.amountPaid || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">PKR {(sale.totalProfit || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No sales found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalesReport;