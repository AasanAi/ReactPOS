// src/components/POS.jsx

import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { FaPencilAlt } from 'react-icons/fa';
import { FiSearch, FiPrinter, FiDownload, FiX } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import { useReactToPrint } from 'react-to-print';
import ModernReceipt from './ModernReceipt';

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
    const [editDiscount, setEditDiscount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const receiptRef = useRef();

    // --- FIX: HOOK MOVED TO TOP LEVEL ---
    const handlePrintReceipt = useReactToPrint({
        content: () => receiptRef.current,
    });
    
    // Early return for loading state
    if (!customers || !products) {
        return <div className="text-center p-10 dark:text-gray-400">Loading POS...</div>;
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

    const addToCart = (product) => {
        if (!product) { toast.error("Product not found!"); return; }
        if (product.quantity <= 0) { toast.error(`${product.name} is out of stock!`); return; }
        const itemInCart = cart.find(item => item.barcode === product.barcode);
        const currentQuantityInCart = itemInCart ? itemInCart.quantity : 0;
        if (product.quantity <= currentQuantityInCart) { toast.error("Not enough stock available!"); return; }
        if (itemInCart) {
            setCart(cart.map(item => item.barcode === product.barcode ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { name: product.name, price: product.salePrice, buyPrice: product.buyPrice, quantity: 1, barcode: product.barcode, discount: 0 }]);
        }
    };

    const removeFromCart = (barcode) => {
        setCart(cart.filter((i) => i.barcode !== barcode));
    };

    const calculateTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const calculateTotalDiscount = () => cart.reduce((total, item) => total + (item.discount || 0) * item.quantity, 0);

    const openPaymentModal = () => {
        if (cart.length === 0) { toast.error("Cart is empty!"); return; }
        const total = calculateTotal() - calculateTotalDiscount();
        setTenderedAmount(total.toString());
        setIsPaymentModalOpen(true);
    };
    
    const closePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setSelectedCustomer('walk-in');
    };

    const handleTenderChange = (e) => {
        setTenderedAmount(e.target.value);
    };

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

    const handleDownloadImage = () => {
        const receiptElement = receiptRef.current;
        if (!receiptElement) return;
        toast.loading('Generating Image...');
        html2canvas(receiptElement, { scale: 3, backgroundColor: '#ffffff' })
          .then((canvas) => {
            const image = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            link.href = image; link.download = `receipt-${receiptData.id}.png`; link.click();
            toast.dismiss(); toast.success('Image downloaded!');
          }).catch(err => { toast.dismiss(); toast.error('Could not generate image.'); });
      };

    const openEditModal = (item) => {
        setEditingItem(item);
        setEditQty(item.quantity);
        setEditPrice(item.price);
        setEditDiscount(item.discount || 0);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    const handleUpdateCartItem = () => {
        const productInStock = products.find(p => p.barcode === editingItem.barcode);
        const newQty = parseInt(editQty) || 1;
        const newPrice = parseFloat(editPrice) || 0;
        const newDiscount = parseFloat(editDiscount) || 0;
        if (productInStock && newQty > productInStock.quantity) {
            return toast.error(`Cannot add more than available stock (${productInStock.quantity})`);
        }
        if (newQty <= 0 || newPrice < 0 || newDiscount < 0) {
            return toast.error("Quantity, Price, and Discount must be positive.");
        }
        if (newDiscount >= newPrice) {
            return toast.error("Discount cannot be equal to or greater than the price.");
        }
        setCart(prevCart => prevCart.map(item => item.barcode === editingItem.barcode ? { ...item, quantity: newQty, price: newPrice, discount: newDiscount } : item));
        toast.success("Item updated!");
        closeEditModal();
    };

    const filteredProducts = products.filter(product =>
        (product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.barcode && product.barcode.includes(searchTerm))
    );
      
    const cartSubtotal = calculateTotal();
    const totalDiscount = calculateTotalDiscount();
    const cartTotal = cartSubtotal - totalDiscount;
    const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
    const previousDue = selectedCustomerData ? selectedCustomerData.dueBalance : 0;
    const grandTotal = cartTotal + previousDue;
    const amountPaid = parseFloat(tenderedAmount) || 0;
    const newRemainingDue = grandTotal - amountPaid;
    const changeDue = selectedCustomer === 'walk-in' && amountPaid > grandTotal ? amountPaid - grandTotal : 0;

    return (
        <div className="grid grid-cols-12 gap-4 p-4 h-[calc(100vh-65px)] bg-gray-100 dark:bg-gray-900">
            {/* Product Grid Section */}
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
                                <div key={product.id} onClick={() => !isOutOfStock && addToCart(product)} className={`bg-white dark:bg-gray-900 p-3 rounded-lg text-center transition-all duration-200 border border-gray-200 dark:border-gray-700 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-teal-500 hover:shadow-lg transform hover:-translate-y-1'}`}>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm">{product.name}</p>
                                    <p className="text-base text-teal-600 dark:text-teal-400 font-bold">PKR {product.salePrice.toFixed(2)}</p>
                                    <p className={`text-xs font-semibold ${stockColor}`}>Stock: {product.quantity}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            {/* Cart Section */}
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
                                            <button onClick={() => openEditModal(item)} className="text-gray-400 hover:text-blue-500 ml-2 transition-colors"><FaPencilAlt size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-gray-800 dark:text-gray-100">PKR {((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}</p>
                                        {item.discount > 0 && <p className="text-xs text-red-500 line-through">PKR {(item.price * item.quantity).toFixed(2)}</p>}
                                    </div>
                                    <button onClick={() => removeFromCart(item.barcode)} className="text-red-400 hover:text-red-600 transition-colors ml-2">✕</button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                            {totalDiscount > 0 && <div className="text-right text-sm text-red-500">Total Discount: PKR {totalDiscount.toFixed(2)}</div>}
                            <div className="flex justify-between items-center text-xl font-bold">
                                <span className="dark:text-gray-100">Total:</span>
                                <span className="text-4xl text-emerald-600 dark:text-emerald-400">PKR {cartTotal.toFixed(2)}</span>
                            </div>
                            <button onClick={openPaymentModal} className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-lg font-bold text-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl">PROCEED TO PAYMENT</button>
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
            <Modal isOpen={isPaymentModalOpen} onRequestClose={closePaymentModal} contentLabel="Payment Modal" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto mt-24" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
                <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Finalize Sale</h2>
                <div className="mb-4"><label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label><select id="customer" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="walk-in">Walk-in Customer (Cash Sale)</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}</select></div>
                <div className="space-y-2 text-lg dark:text-gray-200 mb-4">
                    <div className="flex justify-between"><span>Cart Total:</span><span className="font-semibold">PKR {cartTotal.toFixed(2)}</span></div>
                    {selectedCustomer !== 'walk-in' && <div className="flex justify-between text-sm text-red-500"><span>Previous Due:</span><span className="font-semibold">PKR {previousDue.toFixed(2)}</span></div>}
                    <hr className="border-gray-300 dark:border-gray-600"/><div className="flex justify-between font-bold text-xl"><span>Grand Total:</span><span>PKR {grandTotal.toFixed(2)}</span></div>
                </div>
                <div className="mb-4"><label htmlFor="tendered" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Paid / Tendered</label><input type="number" id="tendered" value={tenderedAmount} onChange={handleTenderChange} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500" autoFocus /></div>
                <div className="space-y-2 text-lg dark:text-gray-200 font-bold mb-6">
                    <div className={`flex justify-between ${newRemainingDue > 0 ? 'text-red-500' : 'text-green-500'}`}><span>New Remaining Due:</span><span>PKR {newRemainingDue.toFixed(2)}</span></div>
                    {selectedCustomer === 'walk-in' && <div className="flex justify-between text-blue-500"><span>Change to Return:</span><span>PKR {changeDue.toFixed(2)}</span></div>}
                </div>
                <div className="flex justify-end space-x-2">
                    <button onClick={closePaymentModal} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Cancel</button>
                    <button onClick={handleSale} className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600">Confirm Sale</button>
                </div>
            </Modal>

            {/* Receipt Modal */}
            <Modal isOpen={isReceiptModalOpen} onRequestClose={() => setIsReceiptModalOpen(false)} contentLabel="Receipt Modal" className="bg-transparent" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                {receiptData && (
                    <div className="bg-gray-100 p-4 rounded-lg shadow-xl relative">
                        <ModernReceipt ref={receiptRef} sale={receiptData} businessInfo={{ name: "Aasan POS", owner: "Saleem Ullah", whatsapp: "0333-7304781" }} />
                        <div className="flex justify-center gap-4 mt-4">
                            <button onClick={handlePrintReceipt} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"><FiPrinter /> Print</button>
                            <button onClick={handleDownloadImage} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"><FiDownload /> Download</button>
                            <button onClick={() => setIsReceiptModalOpen(false)} className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"><FiX /> Close</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} contentLabel="Edit Cart Item" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto mt-24" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
                {editingItem && (
                    <>
                        <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Edit: {editingItem.name}</h2>
                        <div className="mb-4"><label htmlFor="editQty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label><input type="number" id="editQty" value={editQty} onChange={(e) => setEditQty(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500" autoFocus/></div>
                        <div className="mb-4"><label htmlFor="editPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sale Price (per item)</label><input type="number" id="editPrice" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"/></div>
                        <div className="mb-6"><label htmlFor="editDiscount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount (PKR per item)</label><input type="number" id="editDiscount" value={editDiscount} onChange={(e) => setEditDiscount(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"/></div>
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
export default POS;