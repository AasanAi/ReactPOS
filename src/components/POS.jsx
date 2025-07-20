/**
 * Aasan POS - Full POS System UI with:
 * - Product search
 * - Customer selection with due balance
 * - Cart management
 * - Payment and receipt generation with download
 */
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

function POS() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState(0);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    setProducts([
      { barcode: '111', name: 'Product A', salePrice: 100, buyPrice: 70, quantity: 10 },
      { barcode: '222', name: 'Product B', salePrice: 200, buyPrice: 150, quantity: 5 },
    ]);
    setCustomers([
      { id: 'walk-in', name: 'Walk-in Customer', dueBalance: 0 },
      { id: 'c1', name: 'Ali Khan', dueBalance: 500 },
    ]);
  }, []);

  const addToCart = (barcode) => {
    const product = products.find((p) => p.barcode === barcode);
    if (!product) return toast.error('Product not found');
    const itemInCart = cart.find((item) => item.barcode === barcode);
    const inCartQty = itemInCart ? itemInCart.quantity : 0;
    if (product.quantity <= inCartQty) return toast.error('Out of stock');

    if (itemInCart) {
      setCart(cart.map((item) => item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const calculateTotal = () => cart.reduce((total, item) => total + item.salePrice * item.quantity, 0);

  const handleSale = () => {
    const totalAmount = calculateTotal();
    const amountPaid = parseFloat(tenderedAmount);
    if (isNaN(amountPaid) || amountPaid < 0) return toast.error('Invalid amount');

    const customer = customers.find(c => c.id === selectedCustomer);
    const previousDue = customer ? customer.dueBalance : 0;
    const currentDue = totalAmount - amountPaid;
    const newDue = previousDue + currentDue;

    const receipt = {
      id: Date.now(),
      items: cart,
      totalAmount,
      amountPaid,
      change: amountPaid - totalAmount,
      customerName: customer.name,
      previousDue,
      newDue,
      date: new Date().toLocaleString()
    };

    setReceiptData(receipt);
    setCart([]);
    setIsPaymentModalOpen(false);
    toast.success('Sale completed!');
  };

  const downloadReceipt = () => {
    if (!receiptData) return;
    const content = `Receipt ID: ${receiptData.id}\nDate: ${receiptData.date}\nCustomer: ${receiptData.customerName}\n\nItems:\n${receiptData.items.map(i => `${i.name} x${i.quantity} - PKR ${i.salePrice * i.quantity}`).join('\n')}\n\nTotal: PKR ${receiptData.totalAmount}\nPaid: PKR ${receiptData.amountPaid}\nChange: PKR ${receiptData.change}\nPrevious Due: PKR ${receiptData.previousDue}\nNew Due: PKR ${receiptData.newDue}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `receipt-${receiptData.id}.txt`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Aasan POS</h1>

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Enter barcode and press Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addToCart(e.target.value);
              e.target.value = '';
            }
          }}
          className="border px-4 py-2 rounded w-full"
        />
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name} {c.dueBalance > 0 ? `(Due: PKR ${c.dueBalance})` : ''}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold mb-2">Cart Items</h2>
        {cart.length === 0 && <p>No items in cart.</p>}
        {cart.map((item) => (
          <div key={item.barcode} className="flex justify-between">
            <span>{item.name} x {item.quantity}</span>
            <span>PKR {item.salePrice * item.quantity}</span>
          </div>
        ))}
        <p className="font-bold mt-2">Total: PKR {calculateTotal()}</p>
      </div>

      <button
        onClick={() => {
          setTenderedAmount(calculateTotal());
          setIsPaymentModalOpen(true);
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >Proceed to Payment</button>

      <Modal
        isOpen={isPaymentModalOpen}
        onRequestClose={() => setIsPaymentModalOpen(false)}
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className="text-lg font-bold mb-2">Payment</h2>
        <input
          type="number"
          value={tenderedAmount}
          onChange={(e) => setTenderedAmount(e.target.value)}
          className="w-full border px-3 py-2 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsPaymentModalOpen(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >Cancel</button>
          <button
            onClick={handleSale}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >Confirm</button>
        </div>
      </Modal>

      {receiptData && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Receipt</h3>
          <p>Customer: {receiptData.customerName}</p>
          <p>Date: {receiptData.date}</p>
          <ul className="text-sm my-2">
            {receiptData.items.map((i, idx) => (
              <li key={idx}>{i.name} x{i.quantity} = PKR {i.salePrice * i.quantity}</li>
            ))}
          </ul>
          <p className="mt-2">Total: PKR {receiptData.totalAmount}</p>
          <p>Paid: PKR {receiptData.amountPaid}</p>
          <p>Change: PKR {receiptData.change}</p>
          <p>Previous Due: PKR {receiptData.previousDue}</p>
          <p>New Due: PKR {receiptData.newDue}</p>
          <button
            onClick={downloadReceipt}
            className="mt-4 bg-teal-600 text-white px-4 py-2 rounded"
          >Download Receipt</button>
        </div>
      )}
    </div>
  );
}

export default POS;
