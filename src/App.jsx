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

function MainApp() {
  const { currentUser, userRole, shopOwnerId, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(userRole === 'admin' ? "dashboard" : "pos");
  const [products, setProducts] = useState(null);
  const [salesHistory, setSalesHistory] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [cart, setCart] = useState([]);
  
  const dataIsLoading = products === null || salesHistory === null || customers === null;

  useEffect(() => {
    if (!shopOwnerId) { setProducts([]); setSalesHistory([]); setCustomers([]); setAllUsers([]); return; };
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

  const handleAddProduct = useCallback(async (productToAdd) => { if (!shopOwnerId) return; try { const docRef = await addDoc(collection(db, `users/${shopOwnerId}/products`), productToAdd); setProducts(prev => [...prev, { id: docRef.id, ...productToAdd }]); toast.success("Product added successfully!"); } catch (error) { toast.error("Failed to add product."); } }, [shopOwnerId]);
  const handleUpdateProduct = useCallback(async (updatedProduct) => { if (!shopOwnerId) return; const { id, ...productData } = updatedProduct; if (!id) { toast.error("Product ID is missing."); return; } try { await updateDoc(doc(db, `users/${shopOwnerId}/products`, id), productData); setProducts(prev => prev.map(p => (p.id === id ? updatedProduct : p))); toast.success("Product updated successfully!"); } catch (error) { toast.error("Failed to update product."); } }, [shopOwnerId]);
  const handleDeleteProduct = useCallback(async (productId) => { if (!shopOwnerId) return; try { await deleteDoc(doc(db, `users/${shopOwnerId}/products`, productId)); setProducts(prev => prev.filter(p => p.id !== productId)); toast.success("Product deleted successfully!"); } catch (error) { toast.error("Failed to delete product."); } }, [shopOwnerId]);

  const handleAddCustomer = useCallback(async (customerToAdd) => { if (!shopOwnerId) return; const toastId = toast.loading("Adding customer..."); try { const docRef = await addDoc(collection(db, `users/${shopOwnerId}/customers`), customerToAdd); setCustomers(prevCustomers => [...prevCustomers, { id: docRef.id, ...customerToAdd }]); toast.dismiss(toastId); toast.success("Customer added successfully!"); } catch (error) { toast.dismiss(toastId); console.error("Failed to add customer to Firestore:", error); toast.error("Failed to add customer."); } }, [shopOwnerId]);
  const handleUpdateCustomer = useCallback(async (updatedCustomer) => { if (!shopOwnerId) return; const { id, ...customerData } = updatedCustomer; try { await updateDoc(doc(db, `users/${shopOwnerId}/customers`, id), customerData); setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c)); toast.success("Customer updated successfully!"); } catch (error) { toast.error("Failed to update customer."); } }, [shopOwnerId]);
  const handleDeleteCustomer = useCallback(async (customerId) => { if (!shopOwnerId) return; try { await deleteDoc(doc(db, `users/${shopOwnerId}/customers`, customerId)); setCustomers(prev => prev.filter(c => c.id !== customerId)); toast.success("Customer deleted successfully!"); } catch (error) { toast.error("Failed to delete customer."); } }, [shopOwnerId]);
  
  const handleProcessSale = useCallback(async (saleData) => { if (!shopOwnerId) return; const { saleRecord, customerId } = saleData; let saleToSave = { ...saleRecord, cashierId: currentUser.uid, cashierEmail: currentUser.email }; try { const batch = writeBatch(db); saleRecord.items.forEach(item => { const productInDB = products.find(p => p.barcode === item.barcode); if(productInDB) { const productRef = doc(db, `users/${shopOwnerId}/products`, productInDB.id); batch.update(productRef, { quantity: increment(-item.quantity) }); } }); if (customerId !== 'walk-in') { const customer = customers.find(c => c.id === customerId); if (customer) { saleToSave.customerId = customerId; saleToSave.customerName = customer.name; } const cartTotal = saleRecord.totalAmount; const previousDue = customer ? customer.dueBalance : 0; const grandTotal = cartTotal + previousDue; const amountPaid = saleRecord.amountPaid; const newDue = grandTotal - amountPaid; const customerDocRef = doc(db, `users/${shopOwnerId}/customers`, customerId); batch.update(customerDocRef, { dueBalance: newDue }); } const newSaleRef = doc(collection(db, `users/${shopOwnerId}/sales`)); batch.set(newSaleRef, saleToSave); await batch.commit(); setProducts(prevProducts => prevProducts.map(p => { const itemInCart = saleRecord.items.find(item => item.barcode === p.barcode); return itemInCart ? { ...p, quantity: p.quantity - itemInCart.quantity } : p; })); if (customerId !== 'walk-in') { const customer = customers.find(c => c.id === customerId); const cartTotal = saleRecord.totalAmount; const previousDue = customer ? customer.dueBalance : 0; const grandTotal = cartTotal + previousDue; const amountPaid = saleRecord.amountPaid; const newDue = grandTotal - amountPaid; setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, dueBalance: newDue } : c)); } setSalesHistory(prev => [...prev, { id: newSaleRef.id, ...saleToSave }]); toast.success("Sale recorded and stock updated!"); } catch (error) { console.error("Error processing sale:", error); toast.error("Failed to record sale."); } }, [shopOwnerId, customers, currentUser, products]);
  const handleReceivePayment = useCallback(async (customer, amount) => { if (!shopOwnerId) return; toast.loading("Processing payment..."); try { const customerDocRef = doc(db, `users/${shopOwnerId}/customers`, customer.id); const newBalance = customer.dueBalance - amount; await updateDoc(customerDocRef, { dueBalance: newBalance }); const paymentRecord = { items: [{ name: "Dues Cleared / Payment Received", quantity: 1, price: amount, buyPrice: amount }], totalAmount: amount, amountPaid: amount, totalProfit: 0, date: new Date().toISOString(), paymentType: 'Cash', change: 0, customerId: customer.id, customerName: customer.name, cashierId: currentUser.uid, cashierEmail: currentUser.email }; const docRef = await addDoc(collection(db, `users/${shopOwnerId}/sales`), paymentRecord); setSalesHistory(prev => [...prev, { id: docRef.id, ...paymentRecord }]); setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, dueBalance: newBalance } : c)); toast.dismiss(); toast.success("Payment received and balance updated!"); } catch (error) { toast.dismiss(); console.error("Error receiving payment:", error); toast.error("Failed to process payment."); } }, [shopOwnerId, currentUser]);
  
  // --- NAYE SALES DELETE FUNCTIONS ---
  const handleDeleteSale = useCallback(async (saleIdToDelete) => {
    if (!shopOwnerId) return;
    const toastId = toast.loading("Deleting sale...");
    try {
        await deleteDoc(doc(db, `users/${shopOwnerId}/sales`, saleIdToDelete));
        setSalesHistory(prev => prev.filter(sale => sale.id !== saleIdToDelete));
        toast.dismiss(toastId);
        toast.success("Sale deleted successfully.");
    } catch (error) {
        toast.dismiss(toastId);
        toast.error("Failed to delete sale.");
        console.error("Error deleting sale:", error);
    }
  }, [shopOwnerId]);

  const handleDeleteFilteredSales = useCallback(async (salesToDelete) => {
    if (!shopOwnerId || salesToDelete.length === 0) return;
    const toastId = toast.loading(`Deleting ${salesToDelete.length} sales...`);
    try {
        const batch = writeBatch(db);
        const idsToDelete = new Set();
        salesToDelete.forEach(sale => {
            const saleRef = doc(db, `users/${shopOwnerId}/sales`, sale.id);
            batch.delete(saleRef);
            idsToDelete.add(sale.id);
        });
        await batch.commit();
        setSalesHistory(prev => prev.filter(sale => !idsToDelete.has(sale.id)));
        toast.dismiss(toastId);
        toast.success(`${salesToDelete.length} sales deleted successfully.`);
    } catch (error) {
        toast.dismiss(toastId);
        toast.error("Failed to delete sales.");
        console.error("Error deleting filtered sales:", error);
    }
  }, [shopOwnerId]);

  // --- User Management Functions ---
  const handleResetPassword = useCallback(async (email) => { try { await sendPasswordResetEmail(auth, email); toast.success(`Password reset link sent to ${email}`); } catch (error) { toast.error(error.message || "Failed to send reset link."); } }, []);
  const handleToggleUserStatus = useCallback(async (userToToggle) => { const newStatus = userToToggle.status === 'disabled' ? 'active' : 'disabled'; if (window.confirm(`Are you sure you want to ${newStatus} the user ${userToToggle.email}?`)) { try { const userDocRef = doc(db, "users", userToToggle.uid); await updateDoc(userDocRef, { status: newStatus }); setAllUsers(prevUsers => prevUsers.map(u => u.uid === userToToggle.uid ? { ...u, status: newStatus } : u)); toast.success(`User ${userToToggle.email} has been ${newStatus}.`); } catch (error) { toast.error("Failed to update user status."); } } }, []);
  
  // --- Settings Function ---
  const handleClearAllData = useCallback(async () => { if (!shopOwnerId) return; const confirmationText = "DELETE"; const userInput = prompt(`This will delete ALL data. Type "${confirmationText}" to confirm.`); if (userInput !== confirmationText) { if (userInput !== null) { toast.error("Confirmation text did not match."); } return; } toast.loading("Clearing all data..."); try { const batch = writeBatch(db); const collectionsToDelete = ['products', 'sales', 'customers']; for (const coll of collectionsToDelete) { const snapshot = await getDocs(collection(db, `users/${shopOwnerId}/${coll}`)); snapshot.forEach(document => batch.delete(document.ref)); } await batch.commit(); toast.dismiss(); toast.success("All data has been cleared."); setProducts([]); setSalesHistory([]); setCustomers([]); } catch (error) { toast.dismiss(); console.error("Error clearing all data:", error); toast.error("Failed to clear data."); } }, [shopOwnerId]);

  if (dataIsLoading) return <LoadingSpinner />;

  if (userRole === 'cashier') {
    return ( <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900"> <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center"> <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400">Aasan POS - Cashier</h1> <button onClick={logout} className="flex items-center space-x-2 text-red-500 hover:text-red-700 font-semibold transition-colors"> <FiLogOut /> <span>Logout</span> </button> </header> <main className="flex-grow"> <POS products={products} customers={customers} onProcessSale={handleProcessSale} cart={cart} setCart={setCart} /> </main> </div> );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow animate-fade-in-up" key={activeTab}>
        {activeTab === 'dashboard' && <Dashboard products={products} salesHistory={salesHistory} customers={customers} />}
        {activeTab === 'pos' && <POS products={products} customers={customers} onProcessSale={handleProcessSale} cart={cart} setCart={setCart} />}
        {activeTab === 'inventory' && <Inventory products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />}
        {activeTab === 'customers' && <Customers customers={customers} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} onDeleteCustomer={handleDeleteCustomer} onReceivePayment={handleReceivePayment} />}
        {activeTab === 'sales report' && <SalesReport salesHistory={salesHistory} onDeleteSale={handleDeleteSale} onDeleteFilteredSales={handleDeleteFilteredSales} />}
        {activeTab === 'settings' && <Settings onClearData={handleClearAllData} allUsers={allUsers} onResetPassword={handleResetPassword} onToggleUserStatus={handleToggleUserStatus} />}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return ( <> <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#333', color: '#fff' } }} /> {currentUser ? <MainApp /> : <Login />} </> );
}