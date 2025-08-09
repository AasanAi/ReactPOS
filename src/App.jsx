// src/App.jsx

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
import VerifyEmail from "./components/VerifyEmail";
import { FiLogOut } from "react-icons/fi";

function MainApp() {
  const { currentUser, userRole, shopOwnerId, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); 

  useEffect(() => {
    if (userRole) {
      if (userRole === 'admin') {
        setActiveTab('dashboard');
      } else if (userRole === 'cashier') {
        setActiveTab('pos');
      }
    }
  }, [userRole]);

  const [products, setProducts] = useState(null);
  const [salesHistory, setSalesHistory] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [cart, setCart] = useState([]);
  
  const [shopName, setShopName] = useState("AASAN POS");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopLogo, setShopLogo] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const savedShopName = localStorage.getItem(`shopName_${uid}`);
    const savedShopAddress = localStorage.getItem(`shopAddress_${uid}`);
    const savedShopPhone = localStorage.getItem(`shopPhone_${uid}`);
    const savedShopLogo = localStorage.getItem(`shopLogo_${uid}`);
    
    setShopName(savedShopName || "AASAN POS");
    setShopAddress(savedShopAddress || "");
    setShopPhone(savedShopPhone || "");
    setShopLogo(savedShopLogo || null);
  }, [currentUser]);

  const handleUpdateShopName = (newName) => { if (!currentUser) return; setShopName(newName); localStorage.setItem(`shopName_${currentUser.uid}`, newName); };
  const handleUpdateShopAddress = (newAddress) => { if (!currentUser) return; setShopAddress(newAddress); localStorage.setItem(`shopAddress_${currentUser.uid}`, newAddress); };
  const handleUpdateShopPhone = (newPhone) => { if (!currentUser) return; setShopPhone(newPhone); localStorage.setItem(`shopPhone_${currentUser.uid}`, newPhone); };
  const handleUpdateShopLogo = (newLogo) => { if (!currentUser) return; setShopLogo(newLogo); if (newLogo) { localStorage.setItem(`shopLogo_${currentUser.uid}`, newLogo); } else { localStorage.removeItem(`shopLogo_${currentUser.uid}`); } };
  
  const dataIsLoading = products === null || salesHistory === null || customers === null;

  useEffect(() => {
    if (!shopOwnerId) return;
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
        setProducts([]); setSalesHistory([]); setCustomers([]); setAllUsers([]);
      }
    };
    fetchData();
  }, [shopOwnerId, userRole, currentUser]);

  const handleAddProduct = useCallback(async (productToAdd) => { if (!shopOwnerId) return; try { const docRef = await addDoc(collection(db, `users/${shopOwnerId}/products`), productToAdd); setProducts(prev => [...prev, { id: docRef.id, ...productToAdd }]); toast.success("Product added successfully!"); } catch (error) { toast.error("Failed to add product."); } }, [shopOwnerId]);
  const handleUpdateProduct = useCallback(async (updatedProduct) => { if (!shopOwnerId) return; const { id, ...productData } = updatedProduct; try { await updateDoc(doc(db, `users/${shopOwnerId}/products`, id), productData); setProducts(prev => prev.map(p => (p.id === id ? updatedProduct : p))); toast.success("Product updated successfully!"); } catch (error) { toast.error("Failed to update product."); } }, [shopOwnerId]);
  const handleDeleteProduct = useCallback(async (productId) => { if (!shopOwnerId) return; try { await deleteDoc(doc(db, `users/${shopOwnerId}/products`, productId)); setProducts(prev => prev.filter(p => p.id !== productId)); toast.success("Product deleted successfully!"); } catch (error) { toast.error("Failed to delete product."); } }, [shopOwnerId]);
  const handleAddCustomer = useCallback(async (customerToAdd) => { if (!shopOwnerId) return; try { const docRef = await addDoc(collection(db, `users/${shopOwnerId}/customers`), customerToAdd); setCustomers(prev => [...prev, { id: docRef.id, ...customerToAdd }]); toast.success("Customer added successfully!"); } catch (error) { toast.error("Failed to add customer."); } }, [shopOwnerId]);
  const handleUpdateCustomer = useCallback(async (updatedCustomer) => { if (!shopOwnerId) return; const { id, ...customerData } = updatedCustomer; try { await updateDoc(doc(db, `users/${shopOwnerId}/customers`, id), customerData); setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c)); toast.success("Customer updated successfully!"); } catch (error) { toast.error("Failed to update customer."); } }, [shopOwnerId]);
  const handleDeleteCustomer = useCallback(async (customerId) => { if (!shopOwnerId) return; try { await deleteDoc(doc(db, `users/${shopOwnerId}/customers`, customerId)); setCustomers(prev => prev.filter(c => c.id !== customerId)); toast.success("Customer deleted successfully!"); } catch (error) { toast.error("Failed to delete customer."); } }, [shopOwnerId]);
  const handleProcessSale = useCallback(async (saleData) => { /* ... Aapka Diya Hua Logic ... */ }, [shopOwnerId, customers, currentUser, products]);
  const handleReceivePayment = useCallback(async (customer, amount) => { /* ... Aapka Diya Hua Logic ... */ }, [shopOwnerId, currentUser]);
  const handleDeleteSale = useCallback(async (saleIdToDelete) => { /* ... Aapka Diya Hua Logic ... */ }, [shopOwnerId]);
  const handleDeleteFilteredSales = useCallback(async (salesToDelete) => { /* ... Aapka Diya Hua Logic ... */ }, [shopOwnerId]);
  const handleResetPassword = useCallback(async (email) => { /* ... Aapka Diya Hua Logic ... */ }, []);
  const handleToggleUserStatus = useCallback(async (userToToggle) => { /* ... Aapka Diya Hua Logic ... */ }, []);
  const handleClearAllData = useCallback(async () => { /* ... Aapka Diya Hua Logic ... */ }, [shopOwnerId]);

  if (dataIsLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} shopName={shopName} shopLogo={shopLogo} />
      <main className="flex-grow animate-fade-in-up" key={activeTab}>
        {activeTab === 'dashboard' && userRole === 'admin' && <Dashboard products={products} salesHistory={salesHistory} customers={customers} />}
        {activeTab === 'pos' && <POS products={products} customers={customers} onProcessSale={handleProcessSale} cart={cart} setCart={setCart} shopName={shopName} shopAddress={shopAddress} shopPhone={shopPhone} shopLogo={shopLogo} />}
        
        {/* === YEH HAI ASAL FIX === */}
        {activeTab === 'inventory' && <Inventory products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />}
        {activeTab === 'customers' && userRole === 'admin' && <Customers customers={customers} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} onDeleteCustomer={handleDeleteCustomer} onReceivePayment={handleReceivePayment} />}
        
        {activeTab === 'sales report' && userRole === 'admin' && <SalesReport salesHistory={salesHistory} onDeleteSale={handleDeleteSale} onDeleteFilteredSales={handleDeleteFilteredSales} />}
        {activeTab === 'settings' && userRole === 'admin' && 
            <Settings
              onClearData={handleClearAllData} allUsers={allUsers} onResetPassword={handleResetPassword} onToggleUserStatus={handleToggleUserStatus}
              shopName={shopName} shopAddress={shopAddress} shopPhone={shopPhone} shopLogo={shopLogo}
              onUpdateShopName={handleUpdateShopName} onUpdateShopAddress={handleUpdateShopAddress} onUpdateShopPhone={handleUpdateShopPhone} onUpdateShopLogo={handleUpdateShopLogo}
            />}
      </main>
      {activeTab !== 'pos' && <Footer />}
    </div>
  );
}

export default function App() {
  const { currentUser, userRole, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }

  const renderContent = () => {
    if (!currentUser) return <Login />;
    if (!userRole) return <LoadingSpinner />;
    const isGoogleUser = currentUser.providerData.some(p => p.providerId === 'google.com');
    if (userRole === 'admin' && !currentUser.emailVerified && !isGoogleUser) return <VerifyEmail />;
    return <MainApp />;
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      {renderContent()}
    </>
  );
}