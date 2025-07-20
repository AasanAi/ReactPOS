import React, { useState } from 'react';
import Modal from 'react-modal';
import { utils, writeFile } from 'xlsx';

// Zaroori Note: Excel export ke liye, aapko 'xlsx' library install karni hogi.
// Terminal mein yeh command chalayein: npm install xlsx

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
      (sale.id ? sale.id.toString().toLowerCase() : '').includes(searchTerm.toLowerCase())
    );

  const exportCSV = (data) => { /* ... (Aapka CSV code) ... */ };
  const exportExcel = (data) => { /* ... (Aapka Excel code) ... */ };

  const printReceipt = () => {
      const printContents = document.getElementById('printable-receipt-report').innerHTML;
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        {/* ... (Header, Search, Filters, Export Buttons - No Change) ... */}
        
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full table-auto text-sm">
            {/* ... (Table Head - No Change) ... */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {/* ... (Table Data Cells - No Change) ... */}
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

      <Modal 
        isOpen={!!selectedSale} 
        onRequestClose={() => setSelectedSale(null)} 
        contentLabel="Sale Receipt Modal"
        className="bg-white rounded-lg shadow-xl p-0 w-full max-w-sm mx-auto mt-12"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"
      >
        {selectedSale && (
          <div>
            {/* ID badli gayi hai taaki POS ki receipt se conflict na ho */}
            <div id="printable-receipt-report" className="p-6 font-mono text-sm text-black">
              <h2 className="text-center text-xl font-bold mb-2">Aasan POS</h2>
              <p className="text-center">Sale Invoice</p>
              <hr className="my-3 border-dashed border-black" />
              <p><strong>Sale ID:</strong> {selectedSale.id}</p>
              <p><strong>Date:</strong> {new Date(selectedSale.date).toLocaleString()}</p>
              <p><strong>Customer:</strong> {selectedSale.customerName || 'Walk-in'}</p>
              <hr className="my-3 border-dashed border-black" />
              <table className="w-full">
                {/* ... (Table Head for items) ... */}
                <tbody>
                  {(selectedSale.items || []).map(item => (
                    <tr key={item.barcode}>
                      <td>{item.name}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">{(item.price || 0).toFixed(2)}</td>
                      <td className="text-right">{((item.price || 0) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <hr className="my-3 border-dashed border-black" />
              <div className="flex justify-end mt-2">
                <div className="w-full">
                  <p className="flex justify-between"><strong>Subtotal:</strong> <span>PKR {(selectedSale.totalAmount || 0).toFixed(2)}</span></p>
                  <p className="flex justify-between"><strong>Amount Paid:</strong> <span>PKR {(selectedSale.amountPaid || 0).toFixed(2)}</span></p>
                  {/* --- PROFIT WALI LINE HATA DI GAYI HAI --- */}
                </div>
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-b-lg flex justify-end gap-2">
              <button onClick={printReceipt} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Print</button>
              <button onClick={() => setSelectedSale(null)} className="bg-gray-500 text-white px-8 py-2 rounded-lg hover:bg-gray-600 transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SalesReport;