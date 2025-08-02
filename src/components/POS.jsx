import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { FaPencilAlt } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi'; // Search icon ke liye
import html2canvas from 'html2canvas';

// Receipt Content Component (No changes needed here)
function ReceiptContent({ data }) { /* ... Iska code waisa hi rahega ... */ }

function POS({ products, customers, onProcessSale, cart, setCart }) {
  // Hooks bilkul waise hi rahenge
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const [searchTerm, setSearchTerm] = useState(''); // Product search ke liye

  if (!customers || !products) {
    return <div className="text-center p-10 dark:text-gray-400">Loading POS...</div>;
  }

  // Saare functions (increaseQuantity, handleSale, etc.) bilkul waise hi rahenge
  // Unmein koi changes nahi hain
  const calculateTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const increaseQuantity = (barcode) => { /* ... */ };
  const decreaseQuantity = (barcode) => { /* ... */ };
  const addToCart = (barcode) => { /* ... */ };
  const removeFromCart = (barcode) => { /* ... */ };
  const openPaymentModal = () => { /* ... */ };
  const closePaymentModal = () => { /* ... */ };
  const handleTenderChange = (e) => { /* ... */ };
  const handleSale = () => { /* ... */ };
  const handlePrintReceipt = () => { /* ... */ };
  const handleDownloadImage = () => { /* ... */ };
  const openEditModal = (item) => { /* ... */ };
  const closeEditModal = () => { /* ... */ };
  const handleUpdateCartItem = () => { /* ... */ };
  
  const filteredProducts = products.filter(product =>
    (product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.barcode.includes(searchTerm))
  );

  const cartTotal = calculateTotal();
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  const previousDue = selectedCustomerData ? selectedCustomerData.dueBalance : 0;
  const grandTotal = cartTotal + previousDue;
  const amountPaid = parseFloat(tenderedAmount) || 0;
  const newRemainingDue = grandTotal - amountPaid;
  const changeDue = selectedCustomer === 'walk-in' && amountPaid > grandTotal ? amountPaid - grandTotal : 0;

  return (
    <div className="grid grid-cols-12 gap-4 p-4 h-[calc(100vh-65px)] bg-gray-100 dark:bg-gray-900">
      
      {/* --- Left Side: Product Selection (Naya Design) --- */}
      <div className="col-span-12 lg:col-span-7 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col">
        <div className="relative mb-4">
          <FiSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or barcode..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg pl-12 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-teal-500" 
          />
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.quantity <= 0;
              const stockColor = isOutOfStock ? 'text-red-500' : product.quantity <= 5 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400';
              return (
                <div 
                  key={product.id} 
                  onClick={() => !isOutOfStock && addToCart(product.barcode)}
                  className={`bg-white dark:bg-gray-900 p-3 rounded-lg text-center transition-all duration-200 border border-gray-200 dark:border-gray-700
                    ${isOutOfStock 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer hover:border-teal-500 hover:shadow-lg transform hover:-translate-y-1'}`
                  }
                >
                  <p className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm">{product.name}</p>
                  <p className="text-base text-teal-600 dark:text-teal-400 font-bold">PKR {product.salePrice.toFixed(2)}</p>
                  <p className={`text-xs font-semibold ${stockColor}`}>Stock: {product.quantity}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- Right Side: Shopping Cart (Naya Design) --- */}
      <div className="col-span-12 lg:col-span-5 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col">
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2 dark:border-gray-700">Shopping Cart</h3>
        {cart.length > 0 ? (
          <>
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              {cart.map((item) => (
                <div key={item.barcode} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button onClick={() => decreaseQuantity(item.barcode)} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-100 h-7 w-7 rounded-full font-bold flex items-center justify-center transition-transform hover:scale-110">-</button>
                      <span className="dark:text-gray-200 text-lg w-8 text-center">{item.quantity}</span>
                      <button onClick={() => increaseQuantity(item.barcode)} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-100 h-7 w-7 rounded-full font-bold flex items-center justify-center transition-transform hover:scale-110">+</button>
                      <button onClick={() => openEditModal(item)} className="text-gray-400 hover:text-blue-500 ml-2 transition-colors">
                        <FaPencilAlt size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">PKR {(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.barcode)} className="text-red-400 hover:text-red-600 transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="dark:text-gray-100">Total:</span>
                <span className="text-4xl text-emerald-600 dark:text-emerald-400">PKR {calculateTotal().toFixed(2)}</span>
              </div>
              <button onClick={openPaymentModal} className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-lg font-bold text-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                PROCEED TO PAYMENT
              </button>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col justify-center items-center text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">Your cart is empty.</p>
            <p className="text-gray-400 dark:text-gray-500">Select a product to begin.</p>
          </div>
        )}
      </div>
      
      {/* Modals (Inmein koi change nahi) */}
      <Modal isOpen={isPaymentModalOpen} onRequestClose={closePaymentModal} contentLabel="Payment Modal" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto mt-24" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
         {/* ... (Payment Modal ka JSX bilkul waisa hi rahega) ... */}
      </Modal>

      <Modal isOpen={isReceiptModalOpen} onRequestClose={() => setIsReceiptModalOpen(false)} contentLabel="Receipt Modal" className="bg-white rounded-lg shadow-xl p-0 w-full max-w-sm mx-auto mt-12" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        {receiptData && (
          <div className="printable-receipt">
            <div id="printable-receipt-pos">
              <ReceiptContent data={receiptData} />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-b-lg flex justify-between">
              <button onClick={handleDownloadImage} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">Download Image</button>
              <button onClick={handlePrintReceipt} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Print</button>
              <button onClick={() => setIsReceiptModalOpen(false)} className="bg-gray-500 text-white px-8 py-2 rounded-lg hover:bg-gray-600 transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} contentLabel="Edit Cart Item" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto mt-24" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        {editingItem && (
          <>
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Edit: {editingItem.name}</h2>
            <div className="mb-4"><label htmlFor="editQty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label><input type="number" id="editQty" value={editQty} onChange={(e) => setEditQty(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500" autoFocus/></div>
            <div className="mb-6"><label htmlFor="editPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sale Price (per item)</label><input type="number" id="editPrice" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"/></div>
            <div className="flex justify-end space-x-2"><button onClick={closeEditModal} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Cancel</button><button onClick={handleUpdateCartItem} className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600">Update Item</button></div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default POS;