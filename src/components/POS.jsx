import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

function POS({ products, customers, onProcessSale, cart, setCart }) {
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Debug logs
  console.log("POS loaded");
  console.log("Products:", products);
  console.log("Customers:", customers);

  // Improved guard clauses
  if (!Array.isArray(products) || !Array.isArray(customers)) {
    return <div className="text-center text-red-500 p-6">POS data not loaded!</div>;
  }
  if (products.length === 0) {
    return <div className="text-center text-yellow-500 p-6">No products found in database!</div>;
  }
  if (customers.length === 0) {
    return <div className="text-center text-yellow-500 p-6">No customers found in database!</div>;
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
    setTenderedAmount(calculateTotal());
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

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">POS Working Properly</h2>
      <p className="mb-2">Products: {products.length}</p>
      <p className="mb-2">Customers: {customers.length}</p>
      <input
        type="text"
        placeholder="Enter barcode"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            addToCart(e.target.value);
            e.target.value = '';
          }
        }}
        className="border px-4 py-2 rounded"
      />
      <button onClick={openPaymentModal} className="ml-4 px-6 py-2 bg-blue-600 text-white rounded">Pay</button>
      <Modal isOpen={isPaymentModalOpen} onRequestClose={closePaymentModal}>
        <h2>Payment Modal</h2>
        <input
          type="number"
          value={tenderedAmount}
          onChange={handleTenderChange}
        />
        <button onClick={handleSale}>Confirm</button>
      </Modal>
    </div>
  );
}

export default POS;
