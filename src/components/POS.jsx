import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

function POS({ products, customers, onProcessSale, cart, setCart }) {
  // --- Saare Hooks component ke bilkul shuru mein ---
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // --- "Guard Clause" Hooks ke baad taaki app crash na ho ---
  if (!customers || !products) {
    return <div className="text-center p-10 dark:text-gray-400">Loading POS...</div>;
  }

  // --- Cart Management Functions (No Changes Here) ---
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

  // --- Modal & Sale Functions (Updated Logic) ---
  const openPaymentModal = () => {
    if (cart.length === 0) { toast.error("Cart is empty!"); return; }
    const total = calculateTotal();
    setTenderedAmount(total.toString()); // Amount paid by default is the total
    setIsPaymentModalOpen(true);
  };
  
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedCustomer('walk-in'); // Reset customer on close
  };

  const handleTenderChange = (e) => {
    setTenderedAmount(e.target.value);
  };

  const handleSale = () => {
    const cartTotal = calculateTotal();
    const amountPaid = parseFloat(tenderedAmount) || 0;
    const customer = customers.find(c => c.id === selectedCustomer);
    const previousDue = customer ? customer.dueBalance : 0;
    const grandTotal = cartTotal + previousDue;

    if (selectedCustomer === 'walk-in' && amountPaid < cartTotal) {
        toast.error("Amount paid is less than total for walk-in customer!");
        return;
    }

    const saleRecord = { 
        items: cart, 
        totalAmount: cartTotal,
        totalProfit: cart.reduce((p, i) => p + (i.price - i.buyPrice) * i.quantity, 0), 
        date: new Date().toISOString(), 
        paymentType: amountPaid < cartTotal ? 'Credit' : 'Cash',
        amountPaid: amountPaid, 
        change: amountPaid > cartTotal ? amountPaid - cartTotal : 0
    };

    setReceiptData({ ...saleRecord, id: Date.now(), customerName: customer ? customer.name : "Walk-in Customer", previousDue, newDue: grandTotal - amountPaid });
    onProcessSale({ saleRecord, customerId: selectedCustomer });
    
    setCart([]);
    closePaymentModal();
    setIsReceiptModalOpen(true);
  };
  
  const downloadReceipt = () => {
    if (!receiptData) return;
    const receiptHTML = `<html><head><title>Aasan POS - Receipt #${receiptData.id}</title><style>body{font-family:'Courier New',Courier,monospace;margin:0;padding:1rem;color:#000;background:#fff}.receipt-container{max-width:300px;margin:auto}h2{text-align:center;font-size:1.2rem;margin:0 0 .5rem 0}p{margin:2px 0}hr{border:none;border-top:1px dashed #000;margin:.75rem 0}table{width:100%;font-size:.8rem;border-collapse:collapse}th,td{padding:2px 0}.text-left{text-align:left}.text-right{text-align:right}.total-section{display:flex;justify-content:flex-end;margin-top:.5rem}.total-details{width:100%}.total-details p{display:flex;justify-content:space-between}.total-details strong{font-weight:700}.footer{text-align:center;margin-top:1rem;font-size:.7rem}</style></head><body><div class="receipt-container"><h2>Aasan POS</h2><p style="text-align:center">Sale Receipt</p><hr><p><strong>Sale ID:</strong> ${receiptData.id}</p><p><strong>Date:</strong> ${new Date(receiptData.date).toLocaleString()}</p><p><strong>Customer:</strong> ${receiptData.customerName}</p><hr><table><thead><tr><th class="text-left">Item</th><th class="text-right">Qty</th><th class="text-right">Price</th><th class="text-right">Total</th></tr></thead><tbody>${receiptData.items.map(item=>`<tr><td>${item.name}</td><td class="text-right">${item.quantity}</td><td class="text-right">${item.price.toFixed(2)}</td><td class="text-right">${(item.price*item.quantity).toFixed(2)}</td></tr>`).join('')}</tbody></table><hr><div class="total-section"><div class="total-details"><p><strong>Cart Total:</strong> <span>PKR ${receiptData.totalAmount.toFixed(2)}</span></p>${receiptData.customerName!=="Walk-in Customer"?`<p><strong>Previous Due:</strong> <span>PKR ${receiptData.previousDue.toFixed(2)}</span></p><hr style="margin:2px 0; border-style:dashed;" /><p><strong>Grand Total:</strong> <span>PKR ${(receiptData.totalAmount + receiptData.previousDue).toFixed(2)}</span></p>`:''}<p><strong>Amount Paid:</strong> <span>PKR ${receiptData.amountPaid.toFixed(2)}</span></p>${receiptData.customerName!=="Walk-in Customer"?`<p style="font-size:1rem; font-weight:bold;"><strong>New Balance:</strong> <span>PKR ${receiptData.newDue.toFixed(2)}</span></p>`:''}<p><strong>Change:</strong> <span>PKR ${receiptData.change.toFixed(2)}</span></p></div></div><p class="footer">Thank you for your purchase!</p></div></body></html>`;
    const blob = new Blob([receiptHTML],{type:'text/html'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `receipt-${receiptData.id}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
  };
  
  // --- Naye Calculated Variables ---
  const cartTotal = calculateTotal();
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  const previousDue = selectedCustomerData ? selectedCustomerData.dueBalance : 0;
  const grandTotal = cartTotal + previousDue;
  const amountPaid = parseFloat(tenderedAmount) || 0;
  const newRemainingDue = grandTotal - amountPaid;
  const changeDue = amountPaid > grandTotal ? amountPaid - grandTotal : 0;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Search Products</h3>
            <input type="text" placeholder="Enter product barcode..." onKeyDown={e => { if (e.key === "Enter") { addToCart(e.target.value); e.target.value = ""; } }} className="w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">{products.map((product) => (<div key={product.id} className="flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-teal-50 dark:hover:bg-gray-700" onClick={() => addToCart(product.barcode)}><span className="dark:text-gray-200">{product.name}</span><span className="font-semibold text-gray-800 dark:text-gray-100">PKR {product.salePrice.toFixed(2)}</span></div>))}</div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Shopping Cart</h3>
            {cart.length > 0 ? (<><div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">{cart.map((item) => (<div key={item.barcode} className="flex justify-between items-center border-b pb-3 border-gray-200 dark:border-gray-700"><div><p className="font-semibold text-gray-800 dark:text-gray-100">{item.name}</p><div className="flex items-center gap-3 mt-1"><button onClick={() => decreaseQuantity(item.barcode)} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-100 h-6 w-6 rounded-full font-bold flex items-center justify-center">-</button><span className="dark:text-gray-200">{item.quantity}</span><button onClick={() => increaseQuantity(item.barcode)} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-100 h-6 w-6 rounded-full font-bold flex items-center justify-center">+</button></div></div><div className="flex items-center gap-4"><p className="font-bold text-lg text-gray-800 dark:text-gray-100">PKR {(item.price * item.quantity).toFixed(2)}</p><button onClick={() => removeFromCart(item.barcode)} className="text-red-400 hover:text-red-600 transition-colors">✕</button></div></div>))}</div><div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center"><h4 className="text-xl font-bold dark:text-gray-100">Total:</h4><p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">PKR {calculateTotal().toFixed(2)}</p></div><div className="flex space-x-2 mt-6"><button onClick={openPaymentModal} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-bold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg">Proceed to Payment</button></div></>) : (<div className="text-center py-16"><p className="text-gray-500 dark:text-gray-400 text-lg">Your cart is empty.</p><p className="text-gray-400 dark:text-gray-500">Scan a product to begin.</p></div>)}
        </div>
      </div>
      
      {/* --- PAYMENT MODAL KA NAYA, BEHTAR UI --- */}
      <Modal isOpen={isPaymentModalOpen} onRequestClose={closePaymentModal} contentLabel="Payment Modal" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto mt-24" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Finalize Sale</h2>
        <div className="mb-4"><label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label><select id="customer" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="walk-in">Walk-in Customer (Cash Sale)</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}</select></div>
        
        <div className="space-y-2 text-lg dark:text-gray-200 mb-4">
          <div className="flex justify-between"><span>Cart Total:</span><span className="font-semibold">PKR {cartTotal.toFixed(2)}</span></div>
          {selectedCustomer !== 'walk-in' && <div className="flex justify-between text-sm text-red-500"><span>Previous Due:</span><span className="font-semibold">PKR {previousDue.toFixed(2)}</span></div>}
          <hr className="border-gray-300 dark:border-gray-600"/>
          <div className="flex justify-between font-bold text-xl"><span>Grand Total:</span><span>PKR {grandTotal.toFixed(2)}</span></div>
        </div>

        <div className="mb-4"><label htmlFor="tendered" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Paid / Tendered</label><input type="number" id="tendered" value={tenderedAmount} onChange={handleTenderChange} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500" autoFocus /></div>
        
        <div className="space-y-2 text-lg dark:text-gray-200 font-bold mb-6">
          <div className={`flex justify-between ${newRemainingDue > 0 ? 'text-red-500' : 'text-green-500'}`}><span>New Remaining Due:</span><span>PKR {newRemainingDue.toFixed(2)}</span></div>
          {selectedCustomer === 'walk-in' && <div className="flex justify-between text-blue-500"><span>Change to Return:</span><span>PKR {changeDue.toFixed(2)}</span></div>}
        </div>

        <div className="flex justify-end space-x-2"><button onClick={closePaymentModal} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Cancel</button><button onClick={handleSale} className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600">Confirm Sale</button></div>
      </Modal>

      <Modal isOpen={isReceiptModalOpen} onRequestClose={() => setIsReceiptModalOpen(false)} contentLabel="Receipt Modal" className="bg-white rounded-lg shadow-xl p-0 w-full max-w-sm mx-auto mt-12" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        {receiptData && (<div><div className="p-6 font-mono text-sm text-black"><h2 className="text-center text-xl font-bold mb-2">Aasan POS</h2><p className="text-center">Sale Receipt</p><hr className="my-3 border-dashed border-black" /><p><strong>Sale ID:</strong> {receiptData.id}</p><p><strong>Date:</strong> {new Date(receiptData.date).toLocaleString()}</p><p><strong>Customer:</strong> {receiptData.customerName}</p><hr className="my-3 border-dashed border-black" /><table className="w-full"><thead><tr><th className="text-left">Item</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr></thead><tbody>{receiptData.items.map(i => <tr key={i.barcode}><td>{i.name}</td><td className="text-right">{i.quantity}</td><td className="text-right">{i.price.toFixed(2)}</td><td className="text-right">{(i.price * i.quantity).toFixed(2)}</td></tr>)}</tbody></table><hr className="my-3 border-dashed border-black" /><div className="flex justify-end mt-2"><div className="w-full"><p className="flex justify-between"><strong>Cart Total:</strong> <span>PKR {receiptData.totalAmount.toFixed(2)}</span></p>{receiptData.customerName !== "Walk-in Customer" && <><p className="flex justify-between text-xs text-gray-600"><span>Previous Balance:</span> <span>PKR {receiptData.previousDue.toFixed(2)}</span></p><hr className="my-1 border-dashed" /><p className="flex justify-between"><strong>Grand Total:</strong> <span>PKR {(receiptData.totalAmount + receiptData.previousDue).toFixed(2)}</span></p></>}<p className="flex justify-between"><strong>Amount Paid:</strong> <span>PKR {receiptData.amountPaid.toFixed(2)}</span></p>{receiptData.customerName !== "Walk-in Customer" && <p className="flex justify-between text-lg font-bold mt-1"><strong>New Balance:</strong> <span>PKR {receiptData.newDue.toFixed(2)}</span></p>}<p className="flex justify-between"><strong>Change:</strong> <span>PKR {receiptData.change.toFixed(2)}</span></p></div></div><p className="text-center mt-4 text-xs">Thank you for your purchase!</p></div><div className="text-center p-4 bg-gray-50 rounded-b-lg flex justify-between"><button onClick={downloadReceipt} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">Download Receipt</button><button onClick={() => setIsReceiptModalOpen(false)} className="bg-gray-500 text-white px-8 py-2 rounded-lg hover:bg-gray-600">Close</button></div></div>)}
      </Modal>
    </div>
  );
}
export default POS;