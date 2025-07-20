import React, { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

// Firebase Imports
import { db } from './firebase.js';
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, increment
} from "firebase/firestore";

// Components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Customers from './components/Customers'; // Naya component
import SalesReport from './components/SalesReport';
import Settings from './components/Settings';
import Footer from './components/Footer';
import Login from './components/Login';
import LoadingSpinner from "./components/LoadingSpinner";

function MainApp() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  const [products, setProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]); // Naya state
  const [cart, setCart] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      setDataLoading(true);
      try {
        // Products
        const productsSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/products`));
        setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        // Sales
        const salesSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/sales`));
        setSalesHistory(salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        // Customers
        const customersSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/customers`));
        setCustomers(customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data.");
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  // Product Functions
  const handleAddProduct = useCallback(async (productToAdd) => { /* ... (Pehle jaisa hi) ... */ }, [currentUser]);
  const handleUpdateProduct = useCallback(async (updatedProduct) => { /* ... (Pehle jaisa hi) ... */ }, [currentUser]);
  const handleDeleteProduct = useCallback(async (productId) => { /* ... (Pehle jaisa hi) ... */ }, [currentUser]);

  // Customer Functions
  const handleAddCustomer = useCallback(async (customerToAdd) => {
    if (!currentUser) return;
    try {
      const docRef = await addDoc(collection(db, `users/${currentUser.uid}/customers`), customerToAdd);
      setCustomers(prev => [...prev, { id: docRef.id, ...customerToAdd }]);
      toast.success("Customer added successfully!");
    } catch (error) { toast.error("Failed to add customer."); }
  }, [currentUser]);

  const handleUpdateCustomer = useCallback(async (updatedCustomer) => {
    if (!currentUser) return;
    const { id, ...customerData } = updatedCustomer;
    try {
      await updateDoc(doc(db, `users/${currentUser.uid}/customers`, id), customerData);
      setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
      toast.success("Customer updated successfully!");
    } catch (error) { toast.error("Failed to update customer."); }
  }, [currentUser]);

  const handleDeleteCustomer = useCallback(async (customerId) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/customers`, customerId));
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      toast.success("Customer deleted successfully!");
    } catch (error) { toast.error("Failed to delete customer."); }
  }, [currentUser]);
  
  // Sale and Payment Functions
  const handleProcessSale = useCallback(async (saleData) => {
    if (!currentUser) return;
    const { saleRecord, customerId } = saleData;
    let saleToSave = { ...saleRecord };
  
    try {
      if (customerId !== 'walk-in') {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
          saleToSave.customerId = customerId;
          saleToSave.customerName = customer.name;
        }
        const dueAmount = saleRecord.totalAmount - saleRecord.amountPaid;
        if (dueAmount > 0) {
          const customerDocRef = doc(db, `users/${currentUser.uid}/customers`, customerId);
          await updateDoc(customerDocRef, { dueBalance: increment(dueAmount) });
          setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueBalance: c.dueBalance + dueAmount } : c));
        }
      }
      const docRef = await addDoc(collection(db, `users/${currentUser.uid}/sales`), saleToSave);
      setSalesHistory(prev => [...prev, { id: docRef.id, ...saleToSave }]);
      toast.success("Sale recorded successfully!");
    } catch (error) { toast.error("Failed to record sale."); }
  }, [currentUser, customers]);

  const handleReceivePayment = useCallback(async (customerId, amount) => {
    if (!currentUser) return;
    try {
        const customerDocRef = doc(db, `users/${currentUser.uid}/customers`, customerId);
        await updateDoc(customerDocRef, { dueBalance: increment(-amount) });
        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueBalance: c.dueBalance - amount } : c));
        toast.success("Payment received successfully!");
    } catch (error) { toast.error("Failed to process payment."); }
  }, [currentUser]);

  // Settings Function
  const handleClearAllData = useCallback(async () => { /* ... (Pehle jaisa hi) ... */ }, [currentUser]);

  if (dataLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow animate-fade-in-up" key={activeTab}>
        {activeTab === 'dashboard' && <Dashboard products={products} salesHistory={salesHistory} />}
        {activeTab === 'pos' && 
          <POS 
            products={products}
            customers={customers}
            onProcessSale={handleProcessSale}
            cart={cart}
            setCart={setCart}
          />
        }
        {activeTab === 'inventory' && <Inventory products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />}
        {activeTab === 'customers' && 
          <Customers 
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onReceivePayment={handleReceivePayment}
          />
        }
        {activeTab === 'sales report' && <SalesReport salesHistory={salesHistory} />}
        {activeTab === 'settings' && <Settings onClearData={handleClearAllData} />}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      {currentUser ? <MainApp /> : <Login />}
    </>
  );
}