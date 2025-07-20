import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

// Component ko App.jsx se props mil rahe hain
function POS({ products, customers, onProcessSale, cart, setCart }) {
  
  // --- YEH SABSE ZAROORI GUARD HAI ---
  // Agar customers ka data abhi tak nahi aaya, to kuch bhi render mat karo.
  // Isse '.map' wala crash 100% रुक जाएगा।
  if (!customers) {
    return null; // Ya aap yahan ek chota sa loading message dikha sakte hain
  }

  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

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
    if (!product) {
      toast.error("Product not found!");
      return;
    }
    const itemInCart = cart.find(item => item.barcode === barcode);
    const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;
    if (product.quantity <= currentQuantityInCart) {
      toast.error("Out of stock!");
      return;
    }
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
    // ... (downloadReceipt function mein koi change nahi) ...
  };
  
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Search Products</h3>
          <input type="text" placeholder="Enter product barcode..." onKeyDown={e => { if (e.key === "Enter") { addToCart(e.target.value); e.target.value = ""; } }} className="w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {products && products.map((product) => (
              <div key={product.id} className="flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-teal-50 dark:hover:bg-gray-700" onClick={() => addToCart(product.barcode)}>
                <span className="dark:text-gray-200">{product.name}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">PKR {product.salePrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Shopping Cart</h3>
          {/* ... (Shopping Cart ka baaki JSX) ... */}
        </div>
      </div>
      <Modal isOpen={isPaymentModalOpen} onRequestClose={closePaymentModal} contentLabel="Payment Modal" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto mt-24" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Payment</h2>
        <div className="mb-4">
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
            <select id="customer" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="walk-in">Walk-in Customer (Cash Sale)</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
            </select>
        </div>
        <div className="flex justify-between text-lg mb-2 dark:text-gray-200"><span>Total Amount:</span><span className="font-bold">PKR {calculateTotal().toFixed(2)}</span></div>
        <div className="mb-4"><label htmlFor="tendered" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Paid / Tendered</label><input type="number" id="tendered" value={tenderedAmount} onChange={handleTenderChange} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500" autoFocus /></div>
        <div className="flex justify-end space-x-2"><button onClick={closePaymentModal} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Cancel</button><button onClick={handleSale} className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600">Confirm Sale</button></div>
      </Modal>
      <Modal isOpen={isReceiptModalOpen} onRequestClose={() => setIsReceiptModalOpen(false)} contentLabel="Receipt Modal" className="bg-white rounded-lg shadow-xl p-0 w-full max-w-sm mx-auto mt-12" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        {receiptData && (
          // ... (Receipt Modal ka poora JSX) ...
        )}
      </Modal>
    </div>
  );
}
export default POS;