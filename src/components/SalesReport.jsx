import React, { useState, useMemo } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';

// Yeh Receipt component sirf is file ke andar istemal hoga
function ReceiptContent({ sale }) {
  if (!sale) return null;
  return (
    <div className="p-6 font-mono text-sm text-black">
      <h2 className="text-center text-xl font-bold mb-2">Aasan POS</h2><p className="text-center">Sale Receipt</p><hr className="my-3 border-dashed border-black" /><p><strong>Sale ID:</strong> {sale.id}</p><p><strong>Date:</strong> {new Date(sale.date).toLocaleString()}</p><hr className="my-3 border-dashed border-black" /><table className="w-full"><thead><tr><th className="text-left">Item</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr></thead><tbody>{sale.items.map(item => (<tr key={item.barcode}><td>{item.name}</td><td className="text-right">{item.quantity}</td><td className="text-right">{item.price.toFixed(2)}</td><td className="text-right">{(item.price * item.quantity).toFixed(2)}</td></tr>))}</tbody></table><hr className="my-3 border-dashed border-black" /><div className="flex justify-end mt-2"><div className="w-2/3"><p className="flex justify-between"><strong>Subtotal:</strong> <span>PKR {sale.totalAmount.toFixed(2)}</span></p><p className="flex justify-between"><strong>Tendered:</strong> <span>PKR {sale.tendered.toFixed(2)}</span></p><p className="flex justify-between text-lg font-bold mt-1"><strong>Change:</strong> <span>PKR {sale.change.toFixed(2)}</span></p></div></div><p className="text-center mt-4 text-xs">Thank you for your purchase!</p>
    </div>
  );
}


function SalesReport({ salesHistory }) {
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const filteredSales = useMemo(() => {
    const now = new Date();
    return salesHistory
      .filter(sale => {
        const saleDate = new Date(sale.date);
        if (filterPeriod === 'today') {
          return saleDate.toDateString() === now.toDateString();
        }
        if (filterPeriod === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return saleDate >= oneWeekAgo;
        }
        if (filterPeriod === 'month') {
          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        }
        return true;
      })
      .filter(sale => 
        sale.id.toString().includes(searchTerm)
      );
  }, [salesHistory, filterPeriod, searchTerm]);

  const totalFilteredRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalFilteredProfit = filteredSales.reduce((sum, sale) => sum + sale.totalProfit, 0);
  const totalFilteredTransactions = filteredSales.length;

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

  // ===== YEH NAYA FUNCTION HAI REPORT EXPORT KARNE KE LIYE =====
  const exportReportToCSV = () => {
    if (filteredSales.length === 0) {
      toast.error("No sales data to export for the selected period.");
      return;
    }
    
    let csvRows = [];
    // Header row
    const headers = ["Sale ID", "Date", "Item Name", "Quantity", "Sale Price", "Total Item Price", "Sale Total", "Profit"];
    csvRows.push(headers.join(','));

    // Data rows
    for (const sale of filteredSales) {
      for (const item of sale.items) {
        const row = [
          sale.id,
          new Date(sale.date).toLocaleString(),
          item.name.replace(/,/g, ''), // Comma hatayein taaki CSV format kharab na ho
          item.quantity,
          item.price,
          item.price * item.quantity,
          sale.totalAmount,
          (item.price - item.buyPrice) * item.quantity,
        ];
        csvRows.push(row.join(','));
      }
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `AasanPOS_Sales_Report_${filterPeriod}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Sales Report</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow"><h3 className="text-lg font-semibold text-gray-600">Total Sale</h3><p className="text-3xl font-bold text-emerald-600 mt-2">PKR {totalFilteredRevenue.toFixed(2)}</p></div>
        <div className="bg-white p-6 rounded-xl shadow"><h3 className="text-lg font-semibold text-gray-600">Total Profit</h3><p className="text-3xl font-bold text-green-600 mt-2">PKR {totalFilteredProfit.toFixed(2)}</p></div>
        <div className="bg-white p-6 rounded-xl shadow"><h3 className="text-lg font-semibold text-gray-600">Transactions</h3><p className="text-3xl font-bold text-blue-600 mt-2">{totalFilteredTransactions}</p></div>
      </div>
      
      {/* Filters, Search Bar, aur Export Button */}
      <div className="bg-white p-4 rounded-xl shadow-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex space-x-2">
          {['all', 'today', 'week', 'month'].map(period => (
            <button key={period} onClick={() => setFilterPeriod(period)} className={`capitalize px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filterPeriod === period ? 'bg-teal-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
              {period === 'all' ? 'All Time' : period}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Search by Sale ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
          />
          {/* ===== NAYA EXPORT BUTTON ===== */}
          <button 
            onClick={exportReportToCSV}
            className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sale ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Items</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Total Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Profit</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[...filteredSales].reverse().map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-500">{sale.id}</td>
                  <td className="px-4 py-3 text-gray-800">{new Date(sale.date).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-800">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">PKR {sale.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">PKR {sale.totalProfit.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleViewDetails(sale)} className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600">
                      View Details
                    </button>
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
        className="bg-white rounded-lg shadow-xl p-0 w-full max-w-sm mx-auto mt-12"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"
      >
        <ReceiptContent sale={selectedSale} />
        <div className="text-center p-4 bg-gray-50 rounded-b-lg">
            <button onClick={() => setIsDetailModalOpen(false)} className="bg-gray-500 text-white px-8 py-2 rounded-lg hover:bg-gray-600">
                Close
            </button>
        </div>
      </Modal>
    </div>
  );
}
export default SalesReport;