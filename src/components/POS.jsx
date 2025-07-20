import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

function POS({ products, customers, onProcessSale, cart, setCart }) {
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const calculateTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const openPaymentModal = () => {
    if (cart.length === 0) { toast.error("Cart is empty!"); return; }
    setTenderedAmount(calculateTotal());
    setIsPaymentModalOpen(true);
  };

  const handleSale = () => {
    const totalAmount = calculateTotal();
    const amountPaid = parseFloat(tenderedAmount) || 0;
    if (selectedCustomer === 'walk-in' && amountPaid < totalAmount) {
        toast.error("Amount paid is less than total for walk-in customer!");
        return;
    }
    if (amountPaid > totalAmount && selectedCustomer !== 'walk-in') {
        toast.error("Amount paid cannot be more than total for credit customer!");
        return;
    }
    const saleRecord = { 
        items: cart, totalAmount, 
        totalProfit: cart.reduce((p, i) => p + (i.price - i.buyPrice) * i.quantity, 0), 
        date: new Date().toISOString(), paymentType: amountPaid < totalAmount ? 'Credit' : 'Cash',
        amountPaid: amountPaid, change: amountPaid > totalAmount ? amountPaid - totalAmount : 0
    };
    const customer = customers.find(c => c.id === selectedCustomer);
    const previousDue = customer ? customer.dueBalance : 0;
    const currentTransactionDue = totalAmount - amountPaid;
    const newDue = previousDue + currentTransactionDue;

    setReceiptData({ ...saleRecord, id: Date.now(), customerName: customer ? customer.name : "Walk-in Customer", previousDue, newDue });
    onProcessSale({ saleRecord, customerId: selectedCustomer });
    setCart([]);
    closePaymentModal();
    setIsReceiptModalOpen(true);
    setSelectedCustomer('walk-in');
  };
  
  // ... Baaki ke functions (addToCart, removeFromCart, etc.) yahan aayenge ...
  // Unmein koi change nahi hai.

  return (
    <div className="container mx-auto px-6 py-8">
      {/* ... (Poora POS ka JSX yahan aayega, usmein koi change nahi) ... */}
      <Modal isOpen={isPaymentModalOpen} onRequestClose={() => setIsPaymentModalOpen(false)} contentLabel="Payment Modal" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto mt-24" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Payment</h2>
        <div className="mb-4">
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
            <select id="customer" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="walk-in">Walk-in Customer (Cash Sale)</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
            </select>
        </div>
        <div className="flex justify-between text-lg mb-2 dark:text-gray-200"><span>Total Amount:</span><span className="font-bold">PKR {calculateTotal().toFixed(2)}</span></div>
        <div className="mb-4"><label htmlFor="tendered" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Paid / Tendered</label><input type="number" id="tendered" value={tenderedAmount} onChange={(e) => setTenderedAmount(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500" autoFocus /></div>
        <div className="flex justify-end space-x-2"><button onClick={() => setIsPaymentModalOpen(false)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Cancel</button><button onClick={handleSale} className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600">Confirm Sale</button></div>
      </Modal>
      <Modal isOpen={isReceiptModalOpen} onRequestClose={() => setIsReceiptModalOpen(false)} contentLabel="Receipt Modal" className="bg-white rounded-lg shadow-xl p-0 w-full max-w-sm mx-auto mt-12" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        {receiptData && <div><div className="p-6 font-mono text-sm text-black">
          <h2 className="text-center text-xl font-bold mb-2">Aasan POS</h2><p className="text-center">Sale Receipt</p><hr className="my-3 border-dashed border-black" />
          <p><strong>Sale ID:</strong> {receiptData.id}</p><p><strong>Date:</strong> {new Date(receiptData.date).toLocaleString()}</p><p><strong>Customer:</strong> {receiptData.customerName}</p><hr className="my-3 border-dashed border-black" />
          <table className="w-full"><thead><tr><th className="text-left">Item</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr></thead><tbody>{receiptData.items.map(i => <tr key={i.barcode}><td>{i.name}</td><td className="text-right">{i.quantity}</td><td className="text-right">{i.price.toFixed(2)}</td><td className="text-right">{(i.price * i.quantity).toFixed(2)}</td></tr>)}</tbody></table><hr className="my-3 border-dashed border-black" />
          <div className="flex justify-end mt-2"><div className="w-2/3">
              <p className="flex justify-between"><strong>Subtotal:</strong> <span>PKR {receiptData.totalAmount.toFixed(2)}</span></p>
              <p className="flex justify-between"><strong>Amount Paid:</strong> <span>PKR {receiptData.amountPaid.toFixed(2)}</span></p>
              {receiptData.customerName !== "Walk-in Customer" && <>
                  <p className="flex justify-between text-xs text-gray-600"><span>Previous Balance:</span> <span>PKR {receiptData.previousDue.toFixed(2)}</span></p><hr className="my-1 border-dashed" />
                  <p className="flex justify-between font-bold"><strong>New Balance:</strong> <span>PKR {receiptData.newDue.toFixed(2)}</span></p>
              </>}
              <p className="flex justify-between text-lg font-bold mt-1"><strong>Change:</strong> <span>PKR {receiptData.change.toFixed(2)}</span></p>
          </div></div>
          </div>{/* ... (Baaki ka Modal JSX) ... */}</div>}
      </Modal>
    </div>
  );
}
export default POS;