import React, { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { db, auth } from './firebase.js';
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, increment, query, where
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";

// Components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import SalesReport from './components/SalesReport';
import Settings from './components/Settings';
import Footer from './components/Footer';
import Login from './components/Login';
import LoadingSpinner from "./components/LoadingSpinner";
import { FiLogOut } from "react-icons/fi";
import { syncOfflineSales } from './utils/offlineSales';

function MainApp() {
  const { currentUser, userRole, shopOwnerId, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(userRole === 'admin' ? "dashboard" : "pos");

  const [products, setProducts] = useState(null);
  const [salesHistory, setSalesHistory] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [cart, setCart] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const dataIsLoading = products === null || salesHistory === null || customers === null;

  const syncOfflineSales = useCallback(async () => {
    if (!shopOwnerId || !navigator.onLine || !products || !customers) return;

    const pendingSalesKey = `pendingSales_${shopOwnerId}`;
    const pendingSales = JSON.parse(localStorage.getItem(pendingSalesKey)) || [];

    if (pendingSales.length === 0) return;

    const toastId = toast.loading(`Syncing ${pendingSales.length} offline sale(s)...`);
    let successCount = 0;
    const failedSales = [];

    for (const saleData of pendingSales) {
        try {
            const { saleRecord, customerId } = saleData;
            const batch = writeBatch(db);
            
            saleRecord.items.forEach(item => {
                const productInDB = products.find(p => p.barcode === item.barcode);
                if (productInDB) {
                    const productRef = doc(db, `users/${shopOwnerId}/products`, productInDB.id);
                    batch.update(productRef, { quantity: increment(-item.quantity) });
                }
            });

            if (customerId !== 'walk-in') {
                const customer = customers.find(c => c.id === customerId);
                if (customer) {
                    const cartTotal = saleRecord.totalAmount;
                    const previousDue = customer.dueBalance - (cartTotal - saleRecord.amountPaid); // Adjust for local update
                    const grandTotal = cartTotal + previousDue;
                    const newDue = grandTotal - saleRecord.amountPaid;
                    const customerDocRef = doc(db, `users/${shopOwnerId}/customers`, customerId);
                    batch.update(customerDocRef, { dueBalance: newDue });
                }
            }

            const newSaleRef = doc(collection(db, `users/${shopOwnerId}/sales`));
            batch.set(newSaleRef, { ...saleRecord, synced: true });
            await batch.commit();
            successCount++;
        } catch (error) {
            console.error("Failed to sync one sale:", error, saleData);
            failedSales.push(saleData);
        }
    }
    
    localStorage.setItem(pendingSalesKey, JSON.stringify(failedSales));
    
    toast.dismiss(toastId);
    if (successCount > 0) {
        toast.success(`${successCount} sale(s) synced successfully! Reloading data.`);
        // Data ko dobara fetch karein
        const productsSnapshot = await getDocs(collection(db, `users/${shopOwnerId}/products`));
        setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const salesSnapshot = await getDocs(collection(db, `users/${shopOwnerId}/sales`));
        setSalesHistory(salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const customersSnapshot = await getDocs(collection(db, `users/${shopOwnerId}/customers`));
        setCustomers(customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    if(failedSales.length > 0) {
        toast.error(`${failedSales.length} sale(s) failed to sync. Please try again later.`);
    }
  }, [shopOwnerId, products, customers]);
  
  useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    toast.success("You are back online!", { icon: '✅' });
    syncOfflineSales();
  };

  const handleOffline = () => {
    setIsOnline(false);
    toast.error("You are offline. Sales will be saved locally.", {
      icon: '❌',
      duration: 4000
    });
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, [syncOfflineSales]);
    
  

  useEffect(() => {
    if (!shopOwnerId) {
        setProducts([]); setSalesHistory([]); setCustomers([]); setAllUsers([]);
        return;
    };
    const fetchData = async () => {
      try {
        const productsPromise = getDocs(collection(db, `users/${shopOwnerId}/products`));
        const salesPromise = getDocs(collection(db, `users/${shopOwnerId}/sales`));
        const customersPromise = getDocs(collection(db, `users/${shopOwnerId}/customers`));
        let usersPromise = Promise.resolve({ docs: [] });
        if (userRole === 'admin') {
            const usersQuery = query(collection(db, "users"), where("role", "==", "cashier"), where("adminId", "==", currentUser.uid));
            usersPromise = getDocs(usersQuery);
        }
        const [productsSnapshot, salesSnapshot, customersSnapshot, usersSnapshot] = await Promise.all([productsPromise, salesPromise, customersPromise, usersPromise]);
        setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSalesHistory(salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setCustomers(customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        if (userRole === 'admin') { setAllUsers(usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))); }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load business data.");
        if (error.code === 'failed-precondition') { toast.error("Database index required. Check console (F12) for a link.", { duration: 10000 }); }
        setProducts([]); setSalesHistory([]); setCustomers([]); setAllUsers([]);
      }
    };
    fetchData();
  }, [shopOwnerId, userRole, currentUser]);

  useEffect(() => {
    if (userRole === 'admin' && activeTab === '') { setActiveTab('dashboard'); } 
    else if (userRole === 'cashier') { setActiveTab('pos'); }
  }, [userRole, activeTab]);

  const handleProcessSale = useCallback(async (saleData) => {
    if (!shopOwnerId) return;
    const { saleRecord, customerId } = saleData;
    const saleWithMetadata = { ...saleRecord, cashierId: currentUser.uid, cashierEmail: currentUser.email };
    
    const updateLocalState = () => {
        setSalesHistory(prev => [...prev, saleWithMetadata]);
        saleRecord.items.forEach(item => {
            setProducts(prev => prev.map(p => p.barcode === item.barcode ? { ...p, quantity: p.quantity - item.quantity } : p));
        });
        if (customerId !== 'walk-in') {
            const customer = customers.find(c => c.id === customerId);
            const cartTotal = saleRecord.totalAmount;
            const newDue = (customer.dueBalance || 0) + cartTotal - saleRecord.amountPaid;
            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueBalance: newDue } : c));
        }
    };
    
    if (isOnline) {
        const toastId = toast.loading("Processing online sale...");
        try {
            await syncOfflineSales();
            const batch = writeBatch(db);
            saleRecord.items.forEach(item => {
                const productInDB = products.find(p => p.barcode === item.barcode);
                if (productInDB) {
                    batch.update(doc(db, `users/${shopOwnerId}/products`, productInDB.id), { quantity: increment(-item.quantity) });
                }
            });
            if (customerId !== 'walk-in') {
                const customer = customers.find(c => c.id === customerId);
                const cartTotal = saleRecord.totalAmount;
                const newDue = (customer.dueBalance || 0) + cartTotal - saleRecord.amountPaid;
                batch.update(doc(db, `users/${shopOwnerId}/customers`, customerId), { dueBalance: newDue });
            }
            const newSaleRef = doc(collection(db, `users/${shopOwnerId}/sales`));
            batch.set(newSaleRef, saleWithMetadata);
            await batch.commit();
            updateLocalState();
            toast.dismiss(toastId);
            toast.success("Sale recorded and stock updated!");
        } catch (error) {
            toast.dismiss(toastId);
            toast.error("Online sale failed. Saving to offline queue.");
            saveSaleOffline({ saleRecord: saleWithMetadata, customerId });
        }
    } else {
        saveSaleOffline({ saleRecord: saleWithMetadata, customerId });
    }
    
    function saveSaleOffline(offlineSaleData) {
        toast.success("You are offline. Sale saved locally!", { duration: 4000 });
        const pendingSalesKey = `pendingSales_${shopOwnerId}`;
        const pendingSales = JSON.parse(localStorage.getItem(pendingSalesKey)) || [];
        pendingSales.push(offlineSaleData);
        localStorage.setItem(pendingSalesKey, JSON.stringify(pendingSales));
        updateLocalState();
    }
  }, [shopOwnerId, products, customers, currentUser, isOnline, syncOfflineSales]);
  
  // Baaki saare functions bilkul waise hi rahenge
  const handleAddProduct = useCallback(async (productToAdd) => { /* ... */ }, [shopOwnerId]);
  const handleUpdateProduct = useCallback(async (updatedProduct) => { /* ... */ }, [shopOwnerId]);
  const handleDeleteProduct = useCallback(async (productId) => { /* ... */ }, [shopOwnerId]);
  const handleAddCustomer = useCallback(async (customerToAdd) => {
    if (!shopOwnerId) return;
    
    console.log("2. App.jsx received request to add customer:", customerToAdd);
    console.log("   Saving to path:", `users/${shopOwnerId}/customers`);
    
    try {
      const docRef = await addDoc(collection(db, `users/${shopOwnerId}/customers`), customerToAdd);
      
      console.log("3. SUCCESS! Customer added to Firestore with ID:", docRef.id);
      
      setCustomers(prev => [...prev, { id: docRef.id, ...customerToAdd }]);
      toast.success("Customer added successfully!");
    } catch (error) {
      console.error("3. ERROR! Failed to add customer to Firestore:", error);
      toast.error("Failed to add customer.");
    }
  }, [shopOwnerId]);

  if (dataIsLoading) return <LoadingSpinner />;

  if (userRole === 'cashier') {
    return (
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400">Aasan POS - Cashier</h1>
          <button onClick={logout} className="flex items-center space-x-2 text-red-500 hover:text-red-700 font-semibold transition-colors">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </header>
        <main className="flex-grow">
          <POS products={products} customers={customers} onProcessSale={handleProcessSale} cart={cart} setCart={setCart} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow animate-fade-in-up" key={activeTab}>
        {activeTab === 'dashboard' && <Dashboard products={products} salesHistory={salesHistory} />}
        {activeTab === 'pos' && <POS products={products} customers={customers} onProcessSale={handleProcessSale} cart={cart} setCart={setCart} />}
        {activeTab === 'inventory' && <Inventory products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />}
        {activeTab === 'customers' && <Customers customers={customers} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} onDeleteCustomer={handleDeleteCustomer} onReceivePayment={handleReceivePayment} />}
        {activeTab === 'sales report' && <SalesReport salesHistory={salesHistory} />}
        {activeTab === 'settings' && <Settings onClearData={handleClearAllData} allUsers={allUsers} onResetPassword={handleResetPassword} onToggleUserStatus={handleToggleUserStatus} />}
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