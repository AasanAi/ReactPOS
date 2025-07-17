import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

function POS({ products, setProducts, setSalesHistory, cart, setCart }) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const increaseQuantity = (barcode) => {
    const productInStock = products.find(p => p.barcode === barcode);
    if (!productInStock || productInStock.quantity < 1) { toast.error("No more stock available!"); return; }
    setCart(cart.map(item => item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item));
    setProducts(products.map(p => p.barcode === barcode ? { ...p, quantity: p.quantity - 1 } : p));
  };
  const decreaseQuantity = (barcode) => {
    const itemInCart = cart.find(i => i.barcode === barcode);
    if (itemInCart.quantity === 1) { removeFromCart(barcode); }
    else {
      setCart(cart.map(item => item.barcode === barcode ? { ...item, quantity: item.quantity - 1 } : item));
      setProducts(products.map(p => p.barcode === barcode ? { ...p, quantity: p.quantity + 1 } : p));
    }
  };
  const addToCart = (barcode) => {
    const product = products.find((p) => p.barcode === barcode);
    if (!product) { toast.error("Product not found!"); return; }
    if (product.quantity <= 0) { toast.error("Out of stock!"); return; }
    const existingItemIndex = cart.findIndex((item) => item.barcode === barcode);
    if (existingItemIndex >= 0) { increaseQuantity(barcode); }
    else {
      setCart([...cart, { name: product.name, price: product.salePrice, buyPrice: product.buyPrice, quantity: 1, barcode: product.barcode }]);
      setProducts(products.map((p) => (p.barcode === barcode ? { ...p, quantity: p.quantity - 1 } : p)));
    }
  };
  const removeFromCart = (barcode) => {
    const item = cart.find((i) => i.barcode === barcode);
    if (!item) return;
    setCart(cart.filter((i) => i.barcode !== barcode));
    setProducts(products.map((p) => (p.barcode === barcode ? { ...p, quantity: p.quantity + item.quantity } : p)));
  };
  const calculateTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const openPaymentModal = () => {
    if (cart.length === 0) { toast.error("Cart is empty!"); return; }
    const total = calculateTotal();
    setTenderedAmount(total);
    setChangeAmount(0);
    setIsPaymentModalOpen(true);
  };
  const closePaymentModal = () => setIsPaymentModalOpen(false);
  const handleTenderChange = (e) => {
    const tender = parseFloat(e.target.value) || 0;
    const total = calculateTotal();
    setTenderedAmount(tender);
    setChangeAmount(tender - total);
  };
  const handleSale = () => {
    const totalAmount = calculateTotal();
    if (tenderedAmount < totalAmount) { toast.error("Tendered amount is less than total!"); return; }
    const totalProfit = cart.reduce((profit, item) => profit + (item.price - item.buyPrice) * item.quantity, 0);
    const newSale = { id: Date.now(), items: cart, totalAmount, totalProfit, date: new Date().toISOString(), tendered: tenderedAmount, change: changeAmount };
    setSalesHistory(prevSales => [...prevSales, newSale]);
    toast.success(`Sale completed! Change: PKR ${changeAmount.toFixed(2)}`);
    setCart([]);
    closePaymentModal();
    setReceiptData(newSale);
    setIsReceiptModalOpen(true);
  };
  
  const downloadReceipt = () => {
    if (!receiptData) return;
    const receiptHTML = `<html><head><title>Aasan POS - Receipt #${receiptData.id}</title><style>body{font-family:'Courier New',Courier,monospace;margin:0;padding:1rem;color:#000;background:#fff}.receipt-container{max-width:300px;margin:auto}h2{text-align:center;font-size:1.2rem;margin:0 0 .5rem 0}p{margin:2px 0}hr{border:none;border-top:1px dashed #000;margin:.75rem 0}table{width:100%;font-size:.8rem;border-collapse:collapse}th,td{padding:2px 0}.text-left{text-align:left}.text-right{text-align:right}.total-section{display:flex;justify-content:flex-end;margin-top:.5rem}.total-details{width:66%}.total-details p{display:flex;justify-content:space-between}.total-details strong{font-weight:700}.footer{text-align:center;margin-top:1rem;font-size:.7rem}</style></head><body><div class="receipt-container"><h2>Aasan POS</h2><p style="text-align:center">Sale Receipt</p><hr><p><strong>Sale ID:</strong> ${receiptData.id}</p><p><strong>Date:</strong> ${new Date(receiptData.date).toLocaleString()}</p><hr><table><thead><tr><th class="text-left">Item</th><th class="text-right">Qty</th><th class="text-right">Price</th><th class="text-right">Total</th></tr></thead><tbody>${receiptData.items.map(item=>`<tr><td>${item.name}</td><td class="text-right">${item.quantity}</td><td class="text-right">${item.price.toFixed(2)}</td><td class="text-right">${(item.price*item.quantity).toFixed(2)}</td></tr>`).join('')}</tbody></table><hr><div class="total-section"><div class="total-details"><p><strong>Subtotal:</strong> <span>PKR ${receiptData.totalAmount.toFixed(2)}</span></p><p><strong>Tendered:</strong> <span>PKR ${receiptData.tendered.toFixed(2)}</span></p><p><strong style="font-size:1rem">Change:</strong> <span style="font-size:1rem">PKR ${receiptData.change.toFixed(2)}</span></p></div></div><p class="footer">Thank you for your purchase!</p></div></body></html>`;
    const blob = new Blob([receiptHTML],{type:'text/html'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `receipt-${receiptData.id}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
  };
  
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"><h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Search Products</h3><input type="text" placeholder="Enter product barcode..." onKeyDown={e => { if (e.key === "Enter") { addToCart(e.target.value); e.target.value = ""; } }} className="w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /><div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">{products.map((product) => (<div key={product.barcode} className="flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-teal-50 dark:hover:bg-gray-700" onClick={() => addToCart(product.barcode)}><span className="dark:text-gray-200">{product.name}</span><span className="font-semibold text-gray-800 dark:text-gray-100">PKR {product.salePrice.toFixed(2)}</span></div>))}</div></div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"><h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Shopping Cart</h3>{cart.length > 0 ? (<><div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">{cart.map((item) => (<div key={item.barcode} className="flex justify-between items-center border-b pb-3 border-gray-200 dark:border-gray-700"><div><p className="font-semibold text-gray-800 dark:text-gray-100">{item.name}</p><div className="flex items-center gap-3 mt-1"><button onClick={() => decreaseQuantity(item.barcode)} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-100 h-6 w-6 rounded-full font-bold flex items-center justify-center">-</button><span className="dark:text-gray-200">{item.quantity}</span><button onClick={() => increaseQuantity(item.barcode)} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-100 h-6 w-6 rounded-full font-bold flex items-center justify-center">+</button></div></div><div className="flex items-center gap-4"><p className="font-bold text-lg text-gray-800 dark:text-gray-100">PKR {(item.price * item.quantity).toFixed(2)}</p><button onClick={() => removeFromCart(item.barcode)} className="text-red-400 hover:text-red-600 transition-colors">✕</button></div></div>))}</div><div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center"><h4 className="text-xl font-bold dark:text-gray-100">Total:</h4><p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">PKR {calculateTotal().toFixed(2)}</p></div><div className="flex space-x-2 mt-6"><button onClick={openPaymentModal} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-bold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg">Proceed to Payment</button></div></>) : (<div className="text-center py-16"><p className="text-gray-500 dark:text-gray-400 text-lg">Your cart is empty.</p><p className="text-gray-400 dark:text-gray-500">Scan a product to begin.</p></div>)}</div>
      </div>
      <Modal isOpen={isPaymentModalOpen} onRequestClose={closePaymentModal} contentLabel="Payment Modal" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto mt-24" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"><h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Payment</h2><div className="flex justify-between text-lg mb-2 dark:text-gray-200"><span>Total Amount:</span><span className="font-bold">PKR {calculateTotal().toFixed(2)}</span></div><div className="mb-4"><label htmlFor="tendered" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Tendered</label><input type="number" id="tendered" value={tenderedAmount} onChange={handleTenderChange} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500" autoFocus /></div><div className="flex justify-between text-xl font-bold text-blue-600 dark:text-blue-400 mb-6"><span>Change Due:</span><span>PKR {changeAmount.toFixed(2)}</span></div><div className="flex justify-end space-x-2"><button onClick={closePaymentModal} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Cancel</button><button onClick={handleSale} className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600">Confirm Sale</button></div></Modal>
      <Modal isOpen={isReceiptModalOpen} onRequestClose={() => setIsReceiptModalOpen(false)} contentLabel="Receipt Modal" className="bg-white rounded-lg shadow-xl p-0 w-full max-w-sm mx-auto mt-12" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        {receiptData && (
          <div>
            <div className="p-6 font-mono text-sm text-black">
              <h2 className="text-center text-xl font-bold mb-2">Aasan POS</h2><p className="text-center">Sale Receipt</p><hr className="my-3 border-dashed border-black" /><p><strong>Sale ID:</strong> {receiptData.id}</p><p><strong>Date:</strong> {new Date(receiptData.date).toLocaleString()}</p><hr className="my-3 border-dashed border-black" /><table className="w-full"><thead><tr><th className="text-left">Item</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr></thead><tbody>{receiptData.items.map(item => (<tr key={item.barcode}><td>{item.name}</td><td className="text-right">{item.quantity}</td><td className="text-right">{item.price.toFixed(2)}</td><td className="text-right">{(item.price * item.quantity).toFixed(2)}</td></tr>))}</tbody></table><hr className="my-3 border-dashed border-black" /><div className="flex justify-end mt-2"><div className="w-2/3"><p className="flex justify-between"><strong>Subtotal:</strong> <span>PKR {receiptData.totalAmount.toFixed(2)}</span></p><p className="flex justify-between"><strong>Tendered:</strong> <span>PKR {receiptData.tendered.toFixed(2)}</span></p><p className="flex justify-between text-lg font-bold mt-1"><strong>Change:</strong> <span>PKR {receiptData.change.toFixed(2)}</span></p></div></div><p className="text-center mt-4 text-xs">Thank you for your purchase!</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-b-lg flex justify-between">
              <button onClick={downloadReceipt} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">Download Receipt</button>
              <button onClick={() => setIsReceiptModalOpen(false)} className="bg-gray-500 text-white px-8 py-2 rounded-lg hover:bg-gray-600">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default POS;