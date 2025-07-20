import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

function POS({ products, customers, onProcessSale, cart, setCart }) {
  // ✅ Move all hooks BEFORE any condition
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Guard clause
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

  const closePaymentModal = () => setIsPaymentModalOpen(false);

  const handleTenderChange = (e) => setTenderedAmount(e.target.value);

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
      items: cart,
      totalAmount,
      totalProfit: cart.reduce((p, i) => p + (i.price - i.buyPrice) * i.quantity, 0),
      date: new Date().toISOString(),
      paymentType: amountPaid < totalAmount ? 'Credit' : 'Cash',
      amountPaid,
      change: amountPaid > totalAmount ? amountPaid - totalAmount : 0
    };

    const customer = customers.find(c => c.id === selectedCustomer);
    const previousDue = customer ? customer.dueBalance : 0;
    const currentTransactionDue = totalAmount - amountPaid;
    const newDue = previousDue + currentTransactionDue;

    setReceiptData({
      ...saleRecord,
      id: Date.now(),
      customerName: customer ? customer.name : "Walk-in Customer",
      previousDue,
      newDue
    });

    onProcessSale({ saleRecord, customerId: selectedCustomer });
    setCart([]);
    closePaymentModal();
    setIsReceiptModalOpen(true);
    setSelectedCustomer('walk-in');
  };

  const downloadReceipt = () => {
    if (!receiptData) return;
    const receiptHTML = `
      <html><head><title>Aasan POS - Receipt #${receiptData.id}</title></head><body>
      <h2>Sale Receipt</h2><p>ID: ${receiptData.id}</p><p>Date: ${new Date(receiptData.date).toLocaleString()}</p>
      <p>Customer: ${receiptData.customerName}</p><hr/>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
      ${receiptData.items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.price}</td><td>${(i.price * i.quantity).toFixed(2)}</td></tr>`).join('')}
      </tbody></table><hr/>
      <p>Total: ${receiptData.totalAmount}</p>
      <p>Paid: ${receiptData.amountPaid}</p>
      <p>Change: ${receiptData.change}</p>
      ${receiptData.customerName !== "Walk-in Customer" ? `<p>Previous Due: ${receiptData.previousDue}</p><p>New Due: ${receiptData.newDue}</p>` : ''}
      </body></html>`;

    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // You can keep your return JSX as-is (was working fine)
  return (
    <div>
      {/* Your complete JSX remains unchanged */}
      {/* You can paste the remaining JSX from your existing code here */}
    </div>
  );
}

export default POS;
