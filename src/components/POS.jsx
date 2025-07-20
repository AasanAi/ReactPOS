import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

function POS({ products, customers, onProcessSale, cart, setCart }) {
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  if (!customers || !products) {
    return (
      <div className="text-center p-10 dark:text-gray-400">
        Loading POS data...
      </div>
    );
  }

  const increaseQuantity = (barcode) => {
    const productInStock = products.find(p => p.barcode === barcode);
    const itemInCart = cart.find(item => item.barcode === barcode);
    if (!productInStock || productInStock.quantity <= (itemInCart ? itemInCart.quantity : 0)) {
      toast.error("Not enough stock available!");
      return;
    }
    setCart(cart.map(item => item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const decreaseQuantity = (barcode) => {
    const itemInCart = cart.find(i => i.barcode === barcode);
    if (!itemInCart) return;
    if (itemInCart.quantity === 1) {
      removeFromCart(barcode);
    } else {
      setCart(cart.map(item => item.barcode === barcode ? { ...item, quantity: item.quantity - 1 } : item));
    }
  };

  const addToCart = (barcode) => {
    const product = products.find((p) => p.barcode === barcode);
    if (!product) { toast.error("Product not found!"); return; }
    const itemInCart = cart.find(item => item.barcode === barcode);
    const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;
    if (product.quantity <= currentQuantityInCart) { toast.error("Out of stock!"); return; }
    const existingItemIndex = cart.findIndex((item) => item.barcode === barcode);
    if (existingItemIndex >= 0) {
      increaseQuantity(barcode);
    } else {
      setCart([...cart, { name: product.name, price: product.salePrice, buyPrice: product.buyPrice, quantity: 1, barcode: product.barcode }]);
    }
  };

  const removeFromCart = (barcode) => {
    setCart(cart.filter((i) => i.barcode !== barcode));
  };

  const calculateTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const openPaymentModal = () => {
    if (cart.length === 0) { toast.error("Cart is empty!"); return; }
    const total = calculateTotal();
    setTenderedAmount(total);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const handleTenderChange = (e) => {
    setTenderedAmount(e.target.value);
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

  const downloadReceipt = () => {
    if (!receiptData) return;
    const content = `Receipt ID: ${receiptData.id}\nDate: ${new Date(receiptData.date).toLocaleString()}\nCustomer: ${receiptData.customerName}\n\nItems:\n${receiptData.items.map(i => `${i.name} x${i.quantity} - PKR ${i.price * i.quantity}`).join('\n')}\n\nTotal: PKR ${receiptData.totalAmount}\nPaid: PKR ${receiptData.amountPaid}\nChange: PKR ${receiptData.change}\nPrevious Due: PKR ${receiptData.previousDue}\nNew Due: PKR ${receiptData.newDue}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `receipt-${receiptData.id}.txt`;
    link.click();
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <input
            type="text"
            placeholder="Enter barcode and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addToCart(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full p-2 border rounded"
          />
          <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {products.map((product) => (
              <div key={product.id} className="flex justify-between p-2 border-b cursor-pointer" onClick={() => addToCart(product.barcode)}>
                <span>{product.name}</span>
                <span>PKR {product.salePrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Cart</h2>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="border px-4 py-2 rounded"
            >
              <option value="walk-in">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>
          </div>
          {cart.length > 0 ? (
            <>
              <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
                {cart.map(item => (
                  <li key={item.barcode} className="flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>PKR {(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between">
                <span className="font-bold">Total:</span>
                <span>PKR {calculateTotal().toFixed(2)}</span>
              </div>
              <button onClick={openPaymentModal} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Proceed to Payment</button>
            </>
          ) : <p>Your cart is empty.</p>}
        </div>
      </div>

      <Modal
        isOpen={isPaymentModalOpen}
        onRequestClose={closePaymentModal}
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className="text-lg font-bold mb-2">Payment</h2>
        <input
          type="number"
          value={tenderedAmount}
          onChange={handleTenderChange}
          className="w-full border px-3 py-2 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={closePaymentModal} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
          <button onClick={handleSale} className="bg-green-600 text-white px-4 py-2 rounded">Confirm</button>
        </div>
      </Modal>

      {receiptData && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Receipt</h3>
          <p>Customer: {receiptData.customerName}</p>
          <p>Date: {new Date(receiptData.date).toLocaleString()}</p>
          <ul className="text-sm my-2">
            {receiptData.items.map((i, idx) => (
              <li key={idx}>{i.name} x{i.quantity} = PKR {i.price * i.quantity}</li>
            ))}
          </ul>
          <p className="mt-2">Total: PKR {receiptData.totalAmount}</p>
          <p>Paid: PKR {receiptData.amountPaid}</p>
          <p>Change: PKR {receiptData.change}</p>
          <p>Previous Due: PKR {receiptData.previousDue}</p>
          <p>New Due: PKR {receiptData.newDue}</p>
          <button onClick={downloadReceipt} className="mt-4 bg-teal-600 text-white px-4 py-2 rounded">Download Receipt</button>
        </div>
      )}
    </div>
  );
}

export default POS;