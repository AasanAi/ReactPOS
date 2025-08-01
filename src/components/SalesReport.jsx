import React, { useState } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { utils, writeFile } from 'xlsx';
import html2canvas from 'html2canvas';

// --- NAYA, DEDICATED RECEIPT COMPONENT ---
function ReceiptContent({ data }) {
  if (!data) return null;
  return (
    <div className="p-6 font-mono text-sm text-black">
      <h2 className="text-center text-xl font-bold mb-2">Aasan POS</h2>
      <p className="text-center">Sale Invoice</p>
      <hr className="my-3 border-dashed border-black" />
      <div className="space-y-1">
        <p><strong>Sale ID:</strong> {data.id}</p>
        <p><strong>Date:</strong> {new Date(data.date).toLocaleString()}</p>
        <p><strong>Customer:</strong> {data.customerName || 'Walk-in'}</p>
      </div>
      <hr className="my-3 border-dashed border-black" />
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left font-bold">Item</th>
            <th className="text-right font-bold">Qty</th>
            <th className="text-right font-bold">Price</th>
            <th className="text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {(data.items || []).map((item, index) => (
            <tr key={item.barcode || index}>
              <td>{item.name}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">{(item.price || 0).toFixed(2)}</td>
              <td className="text-right">{((item.price || 0) * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-3 border-dashed border-black" />
      <div className="space-y-1 text-xs">
        <p className="flex justify-between"><strong>Subtotal:</strong> <span>PKR {(data.totalAmount || 0).toFixed(2)}</span></p>
        <p className="flex justify-between"><strong>Amount Paid:</strong> <span>PKR {(data.amountPaid || 0).toFixed(2)}</span></p>
      </div>
      <div className="text-center mt-4 pt-2 border-t border-dashed border-black text-xs">
        <p>Thank you for your business!</p>
        <p className="font-semibold">Powered by Saleem Ullah</p>
        <p>WhatsApp: 0333-7304781</p>
      </div>
    </div>
  );
}


function SalesReport({ salesHistory }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSale, setSelectedSale] = useState(null);

  if (!salesHistory) {
    return <div className="text-center p-10 dark:text-gray-400">Loading sales report...</div>;
  }

  const filteredSales = salesHistory
    .filter(sale => {
      const saleDate = new Date(sale.date);
      const now = new Date();
      if (filter === "today") return saleDate.toDateString() === now.toDateString();
      if (filter === "all") return true;
      return true;
    })
    .filter(sale =>
      (sale.id ? sale.id.toString().toLowerCase() : '').includes(searchTerm.toLowerCase())
    );

  const exportCSV = (data) => {
    if (!data || data.length === 0) { toast.error("No data to export."); return; }
    const headers = ['Sale ID', 'Date', 'Customer', 'Payment Type', 'Total Amount', 'Amount Paid', 'Profit'];
    const csvData = data.map(sale => [
      sale.id, new Date(sale.date).toLocaleString(), sale.customerName || 'Walk-in',
      sale.paymentType || 'N/A', sale.totalAmount || 0, sale.amountPaid || 0, sale.totalProfit || 0
    ]);
    const csvContent = [headers.join(','), ...csvData.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${new Date().toISOString()}.csv`;
    link.click();
  };

  const exportExcel = (data) => {
    if (!data || data.length === 0) { toast.error("No data to export."); return; }
    const worksheet = utils.json_to_sheet(
      data.map(sale => ({
        "Sale ID": sale.id, "Date": new Date(sale.date).toLocaleString(), "Customer": sale.customerName || 'Walk-in',
        "Payment Type": sale.paymentType || 'N/A', "Total Amount": sale.totalAmount || 0, "Amount Paid": sale.amountPaid || 0, "Profit": sale.totalProfit || 0,
      }))
    );
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Sales Report");
    writeFile(workbook, `sales_report_${new Date().toISOString()}.xlsx`);
  };

  const handlePrintReceipt = () => {
    window.print();
  };
  // --- YEH NAYA, SUPER-SMART IMAGE DOWNLOAD FUNCTION HAI ---
  const handleDownloadImage = () => {
    const receiptElement = document.getElementById('printable-receipt-report');
    if (!receiptElement || !selectedSale) return;

    toast.loading('Generating Image...');
    html2canvas(receiptElement, { scale: 3, backgroundColor: null })
      .then((canvas) => {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `receipt-${selectedSale.id}.png`;
        link.click();
        toast.dismiss();
        toast.success('Image downloaded!');
      });
  };


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
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Action</th>
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
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelectedSale(sale)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 text-xs rounded-md transition-colors">View</button>
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
            <ReceiptContent data={selectedSale} />
            <div className="text-center p-4 bg-gray-50 rounded-b-lg flex justify-end gap-2">
              <button onClick={handlePrintReceipt} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Print</button>
              <button onClick={() => setSelectedSale(null)} className="bg-gray-500 text-white px-8 py-2 rounded-lg hover:bg-gray-600 transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SalesReport;