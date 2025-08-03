import React, { useState, useMemo, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { FiPrinter, FiDownload, FiX, FaTrashAlt } from 'react-icons/fi';

// --- NAYA, BEHTAR RECEIPT COMPONENT ---
// Yeh React.forwardRef istemal karta hai, jo printing ke liye zaroori hai
const ModernReceipt = React.forwardRef(({ sale, businessInfo }, ref) => {
  if (!sale) return null;
  return (
    <div ref={ref} className="p-6 font-mono text-sm text-black bg-white">
        <h2 className="text-center text-xl font-bold mb-2">Aasan POS</h2>
        <p className="text-center">Sale Invoice</p>
        <hr className="my-3 border-dashed border-black" />
        <div className="space-y-1">
            <p><strong>Sale ID:</strong> {sale.id}</p>
            <p><strong>Date:</strong> {new Date(sale.date).toLocaleString()}</p>
            <p><strong>Customer:</strong> {sale.customerName || 'Walk-in'}</p>
        </div>
        <hr className="my-3 border-dashed border-black" />
        <table className="w-full">
            <thead><tr><th className="text-left font-bold">Item</th><th className="text-right font-bold">Qty</th><th className="text-right font-bold">Price</th><th className="text-right font-bold">Total</th></tr></thead>
            <tbody>
            {(sale.items || []).map((item, index) => (
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
        <div className="space-y-1 text-xs mt-2">
            <p className="flex justify-between"><strong>Subtotal:</strong> <span>PKR {(sale.totalAmount || 0).toFixed(2)}</span></p>
            <p className="flex justify-between"><strong>Amount Paid:</strong> <span>PKR {(sale.amountPaid || 0).toFixed(2)}</span></p>
        </div>
        <div className="text-center mt-4 pt-2 border-t border-dashed border-black text-xs">
            <p>Thank you for your business!</p>
            <p className="font-semibold">Powered by {businessInfo.owner}</p>
            <p>WhatsApp: {businessInfo.whatsapp}</p>
        </div>
    </div>
  );
});


function SalesReport({ salesHistory, onDeleteSale, onDeleteFilteredSales }) {
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  
  const printableReceiptRef = useRef();
  
  const handlePrint = useReactToPrint({
    content: () => printableReceiptRef.current,
    documentTitle: `Receipt-${selectedSale?.id || ''}`,
    onAfterPrint: () => toast.success('Receipt printed!'),
  });

  const filteredSales = useMemo(() => {
    if (!salesHistory) return [];
    const now = new Date();
    return salesHistory
      .filter(sale => {
        if (!sale.date) return false;
        const saleDate = new Date(sale.date);
        if (filterPeriod === 'today') return saleDate.toDateString() === now.toDateString();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        if (filterPeriod === 'week') return saleDate >= oneWeekAgo;
        if (filterPeriod === 'month') return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        return true;
      })
      .filter(sale => sale.id.toString().includes(searchTerm));
  }, [salesHistory, filterPeriod, searchTerm]);

  const totalFilteredRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const totalFilteredProfit = filteredSales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);
  const totalFilteredTransactions = filteredSales.length;

  const exportReportToCSV = () => { /* ... (Aapka CSV code yahan) ... */ };
  
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
    owner: "Saleem Ullah", whatsapp: "0333-7304781"
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* --- NAYA, CHUPA HUA COMPONENT SIRF PRINT/DOWNLOAD KE LIYE --- */}
      <div className="hidden">
        <ModernReceipt ref={printableReceiptRef} sale={selectedSale} businessInfo={businessInfo} />
      </div>

      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Sales Report</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow"><h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Total Sale</h3><p className="text-3xl font-bold text-emerald-600 mt-2">PKR {totalFilteredRevenue.toFixed(2)}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow"><h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Total Profit</h3><p className="text-3xl font-bold text-green-600 mt-2">PKR {totalFilteredProfit.toFixed(2)}</p></div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow"><h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Transactions</h3><p className="text-3xl font-bold text-blue-600 mt-2">{totalFilteredTransactions}</p></div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* ... Filters aur Search Bar ka JSX ... */}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            {/* ... Table ka JSX ... */}
            <tbody>
              {[...filteredSales].reverse().map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {/* ... Table cells ... */}
                  <td className="px-4 py-3 text-center space-x-2">
                    <button onClick={() => setSelectedSale(sale)} className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600">View</button>
                    <button onClick={() => {if(window.confirm('Delete this sale?')) onDeleteSale(sale.id)}} className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* ... No sales found message ... */}
      </div>

      <Modal
        isOpen={!!selectedSale}
        onRequestClose={() => setSelectedSale(null)}
        contentLabel="Sale Details"
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        {selectedSale && (
          <div className="p-4 rounded-lg shadow-xl relative w-auto dark:text-white">
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