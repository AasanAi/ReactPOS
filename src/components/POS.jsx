// src/components/POS.jsx

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { FaPencilAlt } from 'react-icons/fa';
import { FiSearch, FiPrinter, FiDownload, FiX } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import { useReactToPrint } from 'react-to-print';
import ModernReceipt from './ModernReceipt'; // Naya receipt component import karein

function POS({ products, customers, onProcessSale, cart, setCart }) {
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0); // NAYA STATE FOR DISCOUNT
  const [searchTerm, setSearchTerm] = useState('');
  
  const receiptRef = React.useRef();

  if (!customers || !products) {
    return <div className="text-center p-10 dark:text-gray-400">Loading POS...</div>;
  }

  // Cart logic (no changes here)
  const increaseQuantity = (barcode) => { /* ... existing code ... */ };
  const decreaseQuantity = (barcode) => { /* ... existing code ... */ };
  const removeFromCart = (barcode) => { setCart(cart.filter((i) => i.barcode !== barcode)); };
  
  const addToCart = (product) => {
    if (!product) { toast.error("Product not found!"); return; }
    if (product.quantity <= 0) { toast.error(`${product.name} is out of stock!`); return; }
    const itemInCart = cart.find(item => item.barcode === product.barcode);
    const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;
    if (product.quantity <= currentQuantityInCart) { toast.error("Not enough stock available!"); return; }
    if (itemInCart) {
      setCart(cart.map(item => item.barcode === product.barcode ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { name: product.name, price: product.salePrice, buyPrice: product.buyPrice, quantity: 1, barcode: product.barcode, discount: 0 }]); // Add discount: 0
    }
  };

  const calculateTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const calculateTotalDiscount = () => cart.reduce((total, item) => total + ((item.discount || 0) * item.quantity), 0);
  
  const openPaymentModal = () => { /* ... existing code ... */ };
  const closePaymentModal = () => { /* ... existing code ... */ };
  const handleTenderChange = (e) => { /* ... existing code ... */ };

  const handleSale = () => {
    const subTotal = calculateTotal();
    const totalDiscount = calculateTotalDiscount();
    const cartTotal = subTotal - totalDiscount;

    const amountPaid = parseFloat(tenderedAmount) || 0;
    const customer = customers.find(c => c.id === selectedCustomer);
    const previousDue = customer ? customer.dueBalance : 0;
    const grandTotal = cartTotal + previousDue;
    if (selectedCustomer === 'walk-in' && amountPaid < cartTotal) {
        toast.error("Amount paid is less than total for walk-in customer!");
        return;
    }

    // Profit calculation updated to include discount
    const totalProfit = cart.reduce((p, i) => p + ((i.price - (i.discount || 0)) - i.buyPrice) * i.quantity, 0);

    const saleRecord = { 
        items: cart, totalAmount: cartTotal, totalProfit: totalProfit,
        date: new Date().toISOString(), paymentType: amountPaid < grandTotal ? 'Credit' : 'Cash',
        amountPaid: amountPaid, change: amountPaid > grandTotal ? amountPaid - grandTotal : 0
    };

    setReceiptData({ ...saleRecord, id: Date.now(), customerName: customer ? customer.name : "Walk-in Customer", previousDue, newDue: grandTotal - amountPaid });
    onProcessSale({ saleRecord, customerId: selectedCustomer });
    setCart([]);
    closePaymentModal();
    setIsReceiptModalOpen(true);
  };
  
  const handlePrintReceipt = useReactToPrint({ content: () => receiptRef.current });
  const handleDownloadImage = () => { /* ... existing code ... */ };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditQty(item.quantity);
    setEditPrice(item.price);
    setEditDiscount(item.discount || 0); // SET DISCOUNT
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => { /* ... existing code ... */ };

  const handleUpdateCartItem = () => {
    const productInStock = products.find(p => p.barcode === editingItem.barcode);
    const newQty = parseInt(editQty) || 1;
    const newPrice = parseFloat(editPrice) || 0;
    const newDiscount = parseFloat(editDiscount) || 0; // GET DISCOUNT
    if (newQty > productInStock.quantity) {
      return toast.error(`Cannot add more than available stock (${productInStock.quantity})`);
    }
    if (newQty <= 0 || newPrice < 0 || newDiscount < 0) {
      return toast.error("Quantity, Price, and Discount must be positive.");
    }
    if (newDiscount >= newPrice) {
        return toast.error("Discount cannot be equal to or greater than the price.");
    }
    setCart(prevCart => prevCart.map(item => item.barcode === editingItem.barcode ? { ...item, quantity: newQty, price: newPrice, discount: newDiscount } : item)); // UPDATE WITH DISCOUNT
    toast.success("Item updated!");
    closeEditModal();
  };
  
  // ... Baqi ka JSX neeche ...
  const filteredProducts = products.filter(/* ... */);
  const cartSubtotal = calculateTotal();
  const totalDiscount = calculateTotalDiscount();
  const cartTotal = cartSubtotal - totalDiscount;
  // ...

  return (
    <div className="grid grid-cols-12 gap-4 p-4 h-[calc(100vh-65px)] bg-gray-100 dark:bg-gray-900">
      {/* Product Grid Section (No Major Changes) */}
      <div className="col-span-12 lg:col-span-7 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col">
        {/* ... search bar ... */}
        <div className="flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <div key={product.id} onClick={() => product.quantity > 0 && addToCart(product)} /* ... */>
                 {/* ... product display ... */}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Cart Section (Updated for Discount) */}
      <div className="col-span-12 lg:col-span-5 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col">
        {/* ... cart header ... */}
        {cart.length > 0 ? (
          <>
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              {cart.map((item) => (
                <div key={item.barcode} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                  {/* ... item name, quantity buttons ... */}
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">PKR {((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}</p>
                    {item.discount > 0 && <p className="text-xs text-red-500 line-through">PKR {(item.price * item.quantity).toFixed(2)}</p>}
                  </div>
                  {/* ... remove button ... */}
                </div>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-right text-sm text-red-500">Total Discount: PKR {totalDiscount.toFixed(2)}</div>
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="dark:text-gray-100">Total:</span>
                <span className="text-4xl text-emerald-600 dark:text-emerald-400">PKR {cartTotal.toFixed(2)}</span>
              </div>
              {/* ... proceed button ... */}
            </div>
          </>
        ) : ( /* ... empty cart message ... */ )}
      </div>

      {/* Payment Modal (No Major Changes) */}
      <Modal isOpen={isPaymentModalOpen} /* ... */>
        {/* ... existing modal code ... */}
      </Modal>

      {/* Receipt Modal (UPDATED TO USE MODERN RECEIPT) */}
      <Modal isOpen={isReceiptModalOpen} onRequestClose={() => setIsReceiptModalOpen(false)} contentLabel="Receipt Modal" className="bg-transparent" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-gray-100 p-4 rounded-lg shadow-xl relative">
          <ModernReceipt ref={receiptRef} sale={receiptData} />
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={handlePrintReceipt} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"><FiPrinter /> Print</button>
            <button onClick={handleDownloadImage} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"><FiDownload /> Download</button>
            <button onClick={() => setIsReceiptModalOpen(false)} className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"><FiX /> Close</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal (UPDATED WITH DISCOUNT FIELD) */}
      <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} /* ... */>
        {editingItem && (
          <>
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Edit: {editingItem.name}</h2>
            {/* ... Quantity and Price inputs ... */}
            <div className="mb-6">
              <label htmlFor="editDiscount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount (PKR per item)</label>
              <input type="number" id="editDiscount" value={editDiscount} onChange={(e) => setEditDiscount(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"/>
            </div>
            {/* ... Cancel and Update buttons ... */}
          </>
        )}
      </Modal>
    </div>
  );
}

export default POS;