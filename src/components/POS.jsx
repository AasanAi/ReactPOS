import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

function POS() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState(0);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    console.log("POS component mounted");

    // Simulate fetching data
    setTimeout(() => {
      setProducts([
        { barcode: '111', name: 'Product A', salePrice: 100, buyPrice: 70, quantity: 10 },
        { barcode: '222', name: 'Product B', salePrice: 200, buyPrice: 150, quantity: 5 },
      ]);
      setCustomers([
        { id: 'walk-in', name: 'Walk-in Customer', dueBalance: 0 },
        { id: 'c1', name: 'Ali Khan', dueBalance: 500 },
      ]);
    }, 1000);
  }, []);

  const addToCart = (barcode) => {
    const product = products.find((p) => p.barcode === barcode);
    if (!product) return toast.error('Product not found');
    const itemInCart = cart.find((item) => item.barcode === barcode);
    const inCartQty = itemInCart ? itemInCart.quantity : 0;
    if (product.quantity <= inCartQty) return toast.error('Out of stock');

    if (itemInCart) {
      setCart(
        cart.map((item) =>
          item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const calculateTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleSale = () => {
    const totalAmount = calculateTotal();
    const amountPaid = parseFloat(tenderedAmount);
    if (!amountPaid || amountPaid < 0) return toast.error('Invalid amount');
    toast.success('Sale completed!');
    setCart([]);
    setIsPaymentModalOpen(false);
    setReceiptData({ totalAmount, amountPaid, change: amountPaid - totalAmount });
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">POS Test Interface</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter barcode and press Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addToCart(e.target.value);
              e.target.value = '';
            }
          }}
          className="border px-4 py-2 rounded w-full"
        />
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Cart:</h2>
        {cart.map((item) => (
          <div key={item.barcode} className="flex justify-between">
            <span>{item.name} x {item.quantity}</span>
            <span>PKR {item.price * item.quantity}</span>
          </div>
        ))}
        <p className="font-bold mt-2">Total: PKR {calculateTotal()}</p>
      </div>

      <button
        onClick={() => {
          setTenderedAmount(calculateTotal());
          setIsPaymentModalOpen(true);
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Proceed to Payment
      </button>

      <Modal
        isOpen={isPaymentModalOpen}
        onRequestClose={() => setIsPaymentModalOpen(false)}
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className="text-lg font-bold mb-2">Enter Amount</h2>
        <input
          type="number"
          value={tenderedAmount}
          onChange={(e) => setTenderedAmount(e.target.value)}
          className="w-full border px-3 py-2 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsPaymentModalOpen(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >Cancel</button>
          <button
            onClick={handleSale}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >Confirm</button>
        </div>
      </Modal>

      {receiptData && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Receipt</h3>
          <p>Total: PKR {receiptData.totalAmount}</p>
          <p>Paid: PKR {receiptData.amountPaid}</p>
          <p>Change: PKR {receiptData.change}</p>
        </div>
      )}
    </div>
  );
}

export default POS;
