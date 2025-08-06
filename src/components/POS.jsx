import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { FaPencilAlt } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext';

function POS({ products, customers, onProcessSale, cart, setCart }) {
  const { userRole } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  // --- NAYA: State for item discount type and value ---
  const [editDiscountType, setEditDiscountType] = useState('fixed'); // 'fixed' or 'percentage'
  const [editDiscountValue, setEditDiscountValue] = useState(0); // The value entered by user
  // --- END NAYA ---
  // --- NAYA: State for additional cart discount ---
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  // --- END NAYA ---
  const [searchTerm, setSearchTerm] = useState('');

  if (!customers || !products) {
    return <div className="text-center p-10 dark:text-gray-400">Loading POS...</div>;
  }

  // --- NAYA & UPDATED: increaseQuantity function to fix stock issue ---
  const increaseQuantity = (barcode) => {
    // Hamesha fresh product data use karein
    const productInStock = products.find(p => p.barcode === barcode);
    // Cart mein is item ki current quantity nikalein
    const itemInCart = cart.find(item => item.barcode === barcode);
    const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;

    // Check karein ke kya stock available hai for INCREMENT
    if (!productInStock || productInStock.quantity <= currentQuantityInCart) {
      toast.error("Not enough stock available!");
      return;
    }
    setCart(cart.map(item => item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item));
  };
  // --- END NAYA & UPDATED ---

  const decreaseQuantity = (barcode) => {
    const itemInCart = cart.find(i => i.barcode === barcode);
    if (!itemInCart) return;
    if (itemInCart.quantity === 1) {
      removeFromCart(barcode);
    } else {
      setCart(cart.map(item => item.barcode === barcode ? { ...item, quantity: item.quantity - 1 } : item));
    }
  };

  // --- NAYA & UPDATED: addToCart function to fix stock issue ---
  const addToCart = (barcode) => {
    // Hamesha fresh product data use karein
    const product = products.find((p) => p.barcode === barcode);
    if (!product) { toast.error("Product not found!"); return; }
    if (product.quantity <= 0) { toast.error(`${product.name} is out of stock!`); return; }

    // Cart mein is item ki current quantity nikalein
    const itemInCart = cart.find(item => item.barcode === barcode);
    const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;

    // Check karein ke kya stock available hai for ADDING NEW or INCREMENTING
    if (product.quantity <= currentQuantityInCart) {
      toast.error("Not enough stock available!");
      return;
    }

    const existingItemIndex = cart.findIndex((item) => item.barcode === barcode);
    if (existingItemIndex >= 0) {
      // Agar item pehle se cart mein hai, to quantity badhayein
      increaseQuantity(barcode);
    } else {
      // Add discount properties when adding new item
      setCart([...cart, {
        name: product.name,
        price: product.salePrice,
        buyPrice: product.buyPrice,
        quantity: 1,
        barcode: product.barcode,
        discountType: 'fixed', // Default type
        discountValue: 0, // Default value
        discount: 0 // Calculated discount amount
      }]);
    }
  };
  // --- END NAYA & UPDATED ---

  const removeFromCart = (barcode) => {
    setCart(cart.filter((i) => i.barcode !== barcode));
  };

  // --- NAYA: Updated calculateTotal to account for item discounts ---
  const calculateTotal = () =>
    cart.reduce((total, item) =>
      total + (item.price - (item.discount || 0)) * item.quantity, 0
    );

  // --- NAYA: Helper function to calculate discount amount for an item (Safer version) ---
  const calculateItemDiscount = (item) => {
    // Safety checks
    const price = parseFloat(item?.price) || 0;
    const discountType = item?.discountType;
    const discountValue = parseFloat(item?.discountValue) || 0;

    if (discountType === 'percentage') {
      // Ensure percentage is between 0 and 100
      const clampedPercentage = Math.max(0, Math.min(100, discountValue));
      return (price * clampedPercentage) / 100;
    } else if (discountType === 'fixed') {
      // Ensure fixed discount doesn't exceed price and is not negative
      return Math.max(0, Math.min(price, discountValue));
    }
    // Default case if type is unknown or not set
    return 0;
  };

  // --- NAYA: Helper function to calculate total item discount for the cart ---
  const calculateTotalItemDiscount = () =>
    cart.reduce((total, item) => total + (item.discount || 0) * item.quantity, 0);

  const openPaymentModal = () => {
    if (cart.length === 0) { toast.error("Cart is empty!"); return; }
    const total = calculateTotal();
    setTenderedAmount(total.toString());
    // --- NAYA: Reset additional discount when opening modal ---
    setAdditionalDiscount(0);
    // --- END NAYA ---
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedCustomer('walk-in');
    // --- NAYA: Reset additional discount when closing modal ---
    setAdditionalDiscount(0);
    // --- END NAYA ---
  };

  const handleTenderChange = (e) => {
    setTenderedAmount(e.target.value);
  };

  const handleSale = () => {
    const cartTotal = calculateTotal(); // This now includes item discounts
    // --- NAYA: Calculate final total after additional discount ---
    const totalAfterAdditionalDiscount = cartTotal - additionalDiscount;
    const amountPaid = parseFloat(tenderedAmount) || 0;
    const customer = customers.find(c => c.id === selectedCustomer);
    const previousDue = customer ? customer.dueBalance : 0;
    // const grandTotal = cartTotal + previousDue; // <-- Purana line
    const grandTotal = totalAfterAdditionalDiscount + previousDue; // <-- Naya line
    // --- END NAYA ---

    if (selectedCustomer === 'walk-in' && amountPaid < totalAfterAdditionalDiscount) {
      toast.error("Amount paid is less than total for walk-in customer!");
      return;
    }

    const saleRecord = {
      items: cart,
      totalAmount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0), // Original subtotal (without any discount)
      // --- NAYA: Store additional discount ---
      additionalDiscount: additionalDiscount,
      // --- NAYA: Store total discount applied (item discount + additional discount) ---
      totalDiscount: calculateTotalItemDiscount() + additionalDiscount,
      // --- END NAYA ---
      totalProfit: cart.reduce((p, i) => p + ((i.price - i.buyPrice) - (i.discount || 0)) * i.quantity, 0) - additionalDiscount, // Adjust profit
      date: new Date().toISOString(),
      paymentType: amountPaid < grandTotal ? 'Credit' : 'Cash',
      // --- NAYA: Use totalAfterAdditionalDiscount for amountPaid comparison if needed, or keep grandTotal ---
      amountPaid: amountPaid,
      change: amountPaid > grandTotal ? amountPaid - grandTotal : 0
    };

    setReceiptData({
      ...saleRecord,
      id: Date.now(),
      customerName: customer ? customer.name : "Walk-in Customer",
      previousDue,
      newDue: grandTotal - amountPaid
    });

    onProcessSale({ saleRecord, customerId: selectedCustomer });
    setCart([]);
    closePaymentModal();
    setIsReceiptModalOpen(true);
  };

  const handlePrintReceipt = () => window.print();
  const handleDownloadImage = () => {
    const receiptElement = document.getElementById('printable-modern-receipt');
    if (!receiptElement) return;
    toast.loading('Generating Image...');
    html2canvas(receiptElement, { scale: 3, backgroundColor: '#ffffff' })
      .then((canvas) => {
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image; link.download = `receipt-${receiptData?.id}.png`; link.click();
        toast.dismiss(); toast.success('Image downloaded!');
      }).catch(err => { toast.dismiss(); toast.error('Could not generate image.'); });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditQty(item.quantity);
    setEditPrice(item.price);
    // --- NAYA: Set discount type and value when opening edit modal ---
    setEditDiscountType(item.discountType || 'fixed');
    setEditDiscountValue(item.discountValue || 0);
    // --- END NAYA ---
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    // --- NAYA: Reset discount state on close ---
    setEditDiscountType('fixed');
    setEditDiscountValue(0);
    // --- END NAYA ---
  };

  const handleUpdateCartItem = () => {
    const productInStock = products.find(p => p.barcode === editingItem.barcode);
    const newQty = parseInt(editQty) || 1;
    const newPrice = parseFloat(editPrice) || 0;
    // --- NAYA: Get discount type and value ---
    const newDiscountType = editDiscountType;
    const newDiscountValue = parseFloat(editDiscountValue) || 0;
    // --- END NAYA ---

    if (newQty > productInStock.quantity) {
      return toast.error(`Cannot add more than available stock (${productInStock.quantity})`);
    }
    if (newQty <= 0 || newPrice < 0 || newDiscountValue < 0) {
      return toast.error("Quantity, Price, and Discount must be positive.");
    }

    // --- NAYA: Validate discount based on type ---
    let newDiscount = 0;
    if (newDiscountType === 'percentage') {
      if (newDiscountValue > 100) {
        return toast.error("Percentage discount cannot be greater than 100%.");
      }
      newDiscount = (newPrice * newDiscountValue) / 100;
    } else {
      if (newDiscountValue >= newPrice) {
        return toast.error("Fixed discount cannot be equal or greater than item price.");
      }
      newDiscount = newDiscountValue;
    }
    // --- END NAYA ---

    // --- NAYA: Update cart with discount type, value, and calculated discount ---
    setCart(prevCart =>
      prevCart.map(item =>
        item.barcode === editingItem.barcode
          ? {
            ...item,
            quantity: newQty,
            price: newPrice,
            discountType: newDiscountType,
            discountValue: newDiscountValue,
            discount: newDiscount // Store the calculated discount per item
          }
          : item
      )
    );
    // --- END NAYA ---
    toast.success("Item updated!");
    closeEditModal();
  };

  const filteredProducts = products.filter(product =>
    (product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.barcode.includes(searchTerm))
  );

  const cartTotal = calculateTotal();
  const totalItemDiscount = calculateTotalItemDiscount(); // Get total item discount
  // --- NAYA: Calculate final total after additional discount ---
  const totalAfterAdditionalDiscount = cartTotal - additionalDiscount;
  // --- END NAYA ---
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  const previousDue = selectedCustomerData ? selectedCustomerData.dueBalance : 0;
  // const grandTotal = cartTotal + previousDue; // <-- Purana line
  const grandTotal = totalAfterAdditionalDiscount + previousDue; // <-- Naya line
  const amountPaid = parseFloat(tenderedAmount) || 0;
  const newRemainingDue = grandTotal - amountPaid;
  const changeDue = selectedCustomer === 'walk-in' && amountPaid > grandTotal ? amountPaid - grandTotal : 0;

  return (
    <div className="grid grid-cols-12 gap-4 p-4 h-[calc(100vh-65px)] bg-gray-100 dark:bg-gray-900">
      {/* Left Column: Products */}
      <div className="col-span-12 lg:col-span-7 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col">
        <div className="relative mb-4">
          <FiSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search by name or barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg pl-12 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.quantity <= 0;
              const stockColor = isOutOfStock ? 'text-red-500' : product.quantity <= 5 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400';
              return (
                <div key={product.id} onClick={() => !isOutOfStock && addToCart(product.barcode)} className={`bg-white dark:bg-gray-900 p-3 rounded-lg text-center transition-all duration-200 border border-gray-200 dark:border-gray-700 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-teal-500 hover:shadow-lg transform hover:-translate-y-1'}`}>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm">{product.name}</p>
                  <p className="text-base text-teal-600 dark:text-teal-400 font-bold">PKR {product.salePrice.toFixed(2)}</p>
                  <p className={`text-xs font-semibold ${stockColor}`}>Stock: {product.quantity}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Cart */}
      <div className="col-span-12 lg:col-span-5 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col">
        {cart.length > 0 ? (
          <>
            {/* --- NAYA SECTION: YEH AB HAMESHA UPAR RAHEGA --- */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <div className="flex justify-between items-center text-xl font-bold mb-4">
                <span className="dark:text-gray-100">Total:</span>
                <span className="text-4xl text-emerald-600 dark:text-emerald-400">PKR {calculateTotal().toFixed(2)}</span>
              </div>
              {/* --- ROLE CHECK WALA BUTTON --- */}
              {(userRole === 'admin' || userRole === 'cashier') && (
                  <button onClick={openPaymentModal} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-lg font-bold text-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                      PROCEED TO PAYMENT
                  </button>
              )}
            </div>
            {/* --- PURANA SECTION: YEH AB NEECHAY SCROLL HOGA --- */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">Shopping Cart</h3>
              {cart.map((item) => (
                <div key={item.barcode} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button onClick={() => decreaseQuantity(item.barcode)} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-100 h-7 w-7 rounded-full font-bold flex items-center justify-center transition-transform hover:scale-110">-</button>
                      <span className="dark:text-gray-200 text-lg w-8 text-center">{item.quantity}</span>
                      <button onClick={() => increaseQuantity(item.barcode)} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-100 h-7 w-7 rounded-full font-bold flex items-center justify-center transition-transform hover:scale-110">+</button>
                      <button onClick={() => openEditModal(item)} className="text-gray-400 hover:text-blue-500 ml-2 transition-colors"><FaPencilAlt size={14} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Updated total display to reflect discount */}
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">PKR {((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.barcode)} className="text-red-400 hover:text-red-600 transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col justify-center items-center text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">Your cart is empty.</p>
            <p className="text-gray-400 dark:text-gray-500">Select a product to begin.</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {/* --- NAYA: overflow-y-auto and max-h-[80vh] added for scrolling --- */}
      <Modal isOpen={isPaymentModalOpen} onRequestClose={closePaymentModal} contentLabel="Payment Modal" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto mt-24 overflow-y-auto max-h-[80vh]" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Finalize Sale</h2>
        <div className="mb-4">
          <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
          <select id="customer" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="walk-in">Walk-in Customer (Cash Sale)</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
          </select>
        </div>

        {/* --- NAYA: Show Cart Items with Discount in Payment Modal --- */}
        <div className="mb-4 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Cart Items:</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left">Item</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Disc</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => {
                const itemTotal = (item.price - (item.discount || 0)) * item.quantity;
                return (
                  <tr key={item.barcode} className="border-b dark:border-gray-700">
                    <td className="py-1 truncate max-w-[80px]">{item.name}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{item.price.toFixed(2)}</td>
                    <td className="text-right text-red-500">
                      {item.discountValue > 0 ?
                        (item.discountType === 'percentage' ?
                          `${item.discountValue.toFixed(1)}%` :
                          `PKR ${item.discountValue.toFixed(2)}`)
                        : '-'}
                    </td>
                    <td className="text-right font-medium">{itemTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* --- END NAYA --- */}

        {/* --- NAYA: Additional Cart Discount Input --- */}
        <div className="mb-4">
          <label htmlFor="additionalDiscount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Additional Cart Discount (PKR)
          </label>
          <input
            type="number"
            id="additionalDiscount"
            value={additionalDiscount}
            onChange={(e) => setAdditionalDiscount(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            min="0"
            // max={cartTotal} // Optional: Prevent discount greater than cart total
          />
          {additionalDiscount > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Subtotal after additional discount: PKR {totalAfterAdditionalDiscount.toFixed(2)}
            </p>
          )}
        </div>
        {/* --- END NAYA --- */}

        <div className="space-y-2 text-lg dark:text-gray-200 mb-4">
          <div className="flex justify-between">
            <span>Original Cart Total:</span>
            <span className="font-semibold">PKR {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
          </div>

          {/* --- NAYA: Show Total Item Discount --- */}
          {totalItemDiscount > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Item Discounts:</span>
              <span className="font-semibold">- PKR {totalItemDiscount.toFixed(2)}</span>
            </div>
          )}
          {/* --- END NAYA --- */}

          {/* --- NAYA: Show Additional Discount --- */}
          {additionalDiscount > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Additional Discount:</span>
              <span className="font-semibold">- PKR {additionalDiscount.toFixed(2)}</span>
            </div>
          )}
          {/* --- END NAYA --- */}

          {/* --- NAYA: Show Subtotal after Additional Discount --- */}
          {additionalDiscount > 0 && (
            <div className="flex justify-between">
              <span>Subtotal after Discount:</span>
              <span className="font-semibold">PKR {totalAfterAdditionalDiscount.toFixed(2)}</span>
            </div>
          )}
          {/* --- END NAYA --- */}

          {selectedCustomer !== 'walk-in' && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Previous Due:</span>
              <span className="font-semibold">PKR {previousDue.toFixed(2)}</span>
            </div>
          )}
          <hr className="border-gray-300 dark:border-gray-600" />
          <div className="flex justify-between font-bold text-xl">
            <span>Grand Total:</span>
            <span>PKR {grandTotal.toFixed(2)}</span>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="tendered" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Paid / Tendered</label>
          <input
            type="number"
            id="tendered"
            value={tenderedAmount}
            onChange={handleTenderChange}
            className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            autoFocus
          />
        </div>
        <div className="space-y-2 text-lg dark:text-gray-200 font-bold mb-6">
          <div className={`flex justify-between ${newRemainingDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
            <span>New Remaining Due:</span>
            <span>PKR {newRemainingDue.toFixed(2)}</span>
          </div>
          {selectedCustomer === 'walk-in' && (
            <div className="flex justify-between text-blue-500">
              <span>Change to Return:</span>
              <span>PKR {changeDue.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={closePaymentModal} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Cancel</button>
          <button onClick={handleSale} className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600">Confirm Sale</button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={isReceiptModalOpen} onRequestClose={() => setIsReceiptModalOpen(false)} contentLabel="Receipt Modal" className="bg-white rounded-lg shadow-xl p-0 w-full max-w-sm mx-auto mt-12" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        {receiptData && (
          <div className="printable-receipt">
            <div id="printable-modern-receipt">
              {/* Use the ModernReceipt component */}
              <ModernReceipt sale={receiptData} businessInfo={{ name: "Saleem Staioner", address: "Qazafi Town Malir Karachi", phone: "0300-1234567" }} />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-b-lg flex justify-between">
              <button onClick={handleDownloadImage} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">Download Image</button>
              <button onClick={handlePrintReceipt} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Print</button>
              <button onClick={() => setIsReceiptModalOpen(false)} className="bg-gray-500 text-white px-8 py-2 rounded-lg hover:bg-gray-600 transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Item Modal */}
      <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} contentLabel="Edit Cart Item" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto mt-24" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        {editingItem && (
          <>
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Edit: {editingItem.name}</h2>

            <div className="mb-4">
              <label htmlFor="editQty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
              <input
                type="number"
                id="editQty"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label htmlFor="editPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sale Price (per item)</label>
              <input
                type="number"
                id="editPrice"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* --- NAYA: Discount Type Selection --- */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Type</label>
              <div className="flex space-x-4 mt-1">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="discountType"
                    checked={editDiscountType === 'fixed'}
                    onChange={() => setEditDiscountType('fixed')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span className="ml-2">Fixed (PKR)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="discountType"
                    checked={editDiscountType === 'percentage'}
                    onChange={() => setEditDiscountType('percentage')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span className="ml-2">Percentage (%)</span>
                </label>
              </div>
            </div>
            {/* --- END NAYA --- */}

            {/* --- NAYA: Discount Value Input --- */}
            <div className="mb-6">
              <label htmlFor="editDiscountValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount Value
              </label>
              <input
                type="number"
                id="editDiscountValue"
                value={editDiscountValue}
                onChange={(e) => setEditDiscountValue(e.target.value)}
                className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder={editDiscountType === 'percentage' ? "e.g., 10" : "e.g., 50"}
              />
              {/* --- NAYA: Show calculated discount per item (with safety) --- */}
              {editDiscountValue > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Discount per item: PKR {calculateItemDiscount({ price: parseFloat(editPrice) || 0, discountType: editDiscountType, discountValue: parseFloat(editDiscountValue) || 0 }).toFixed(2)}
                </p>
              )}
              {/* --- END NAYA --- */}
            </div>
            {/* --- END NAYA --- */}

            <div className="flex justify-end space-x-2">
              <button onClick={closeEditModal} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Cancel</button>
              <button onClick={handleUpdateCartItem} className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600">Update Item</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// --- NAYA: ModernReceipt Component ---
const ModernReceipt = React.forwardRef(({ sale, businessInfo }, ref) => {
  if (!sale) return null;

  // Calculations with discount
  const calculateSubtotal = (items) => items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculateTotalDiscount = (items) => items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
  
  const subtotal = calculateSubtotal(sale.items);
  const totalItemDiscount = calculateTotalDiscount(sale.items);
  const additionalDiscount = sale.additionalDiscount || 0;
  const finalSubtotal = subtotal - totalItemDiscount; // Subtotal after item discounts
  const finalGrandTotal = finalSubtotal - additionalDiscount;
  const change = sale.amountPaid - finalGrandTotal;

  return (
    <div ref={ref} className="bg-white text-gray-800 font-sans p-6 w-[320px] shadow-lg rounded-lg">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{businessInfo?.name || 'Aasan POS'}</h1>
        <p className="text-xs text-gray-500">{businessInfo?.address || 'Modern Sale Receipt'}</p>
        <p className="text-xs text-gray-500">{businessInfo?.phone || ''}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 text-xs mb-4 pb-2 border-b border-dashed">
        <div><strong>Inv #:</strong> {sale.id.toString().slice(-6).toUpperCase()}</div>
        <div className="text-right"><strong>Date:</strong> {new Date(sale.date).toLocaleDateString('en-GB')}</div>
        <div><strong>Customer:</strong></div>
        <div className="text-right">{sale.customerName || 'Walk-in Customer'}</div>
      </div>

      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b">
            <th className="text-left font-semibold py-2">ITEM</th>
            <th className="text-center font-semibold">QTY</th>
            <th className="text-right font-semibold">PRICE</th>
            <th className="text-right font-semibold">DISC/item</th>
            <th className="text-right font-semibold">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={item.barcode || index} className="border-b border-gray-100">
              <td className="py-2">{item.name}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">{item.price.toFixed(2)}</td>
              <td className="text-right text-red-500">{(item.discount || 0).toFixed(2)}</td>
              <td className="text-right font-medium">{((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span>PKR {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Item Discounts:</span>
          <span className="text-red-500">- PKR {totalItemDiscount.toFixed(2)}</span>
        </div>
        {/* --- NAYA: Show Additional Discount on Receipt --- */}
        {additionalDiscount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Additional Discount:</span>
            <span className="text-red-500">- PKR {additionalDiscount.toFixed(2)}</span>
          </div>
        )}
        {/* --- END NAYA --- */}
        <div className="flex justify-between text-base font-bold pt-2 border-t mt-2">
          {/* --- NAYA: Update Grand Total on Receipt --- */}
          <span>Grand Total:</span>
          <span>PKR {finalGrandTotal.toFixed(2)}</span>
          {/* --- END NAYA --- */}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Amount Paid:</span>
          <span>PKR {sale.amountPaid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-gray-600">Change:</span>
          <span>PKR {change > 0 ? change.toFixed(2) : '0.00'}</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t">
        <p>Thank you for shopping with us!</p>
        <p className="font-semibold mt-2">Powered by Saleem Ullah</p>
        <p>WhatsApp: 0333-7304781</p>
      </div>
    </div>
  );
});
// --- END NAYA: ModernReceipt Component ---

export default POS;
