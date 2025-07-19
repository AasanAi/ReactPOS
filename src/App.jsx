import React, { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Customers from './components/Customers';
import Footer from './components/Footer';

// Firestore
import { db } from './firebase.js';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";

// Components
import Header          from './components/Header';
import Dashboard       from './components/Dashboard';
import POS             from './components/POS';
import Inventory       from './components/Inventory';
import SalesReport     from './components/SalesReport';
import Settings        from './components/Settings';
import Login           from './components/Login';
import LoadingSpinner  from "./components/LoadingSpinner";

function MainApp() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
const [customers, setCustomers] = useState([]);
  const [products,      setProducts]      = useState([]);
  const [salesHistory,  setSalesHistory]  = useState([]);
  const [cart,          setCart]          = useState([]);
  const [dataLoading,   setDataLoading]   = useState(true);

  /* ----------------------------------------------------------
     Firestore se data laane ka useEffect
  ---------------------------------------------------------- */
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setDataLoading(true);
      console.log("A. DATA FETCH KARNE KI KOSHISH... User ID:", currentUser.uid);

      try {
        // Products
        const productsSnapshot = await getDocs(
          collection(db, `users/${currentUser.uid}/products`)
        );
		// fetchData function ke andar...
try {
  // ... products aur sales ka code ...

  // Step 3: Customers fetch karein
  const customersPath = `users/${currentUser.uid}/customers`;
  const customersSnapshot = await getDocs(collection(db, customersPath));
  const customersList = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setCustomers(customersList);

} catch (error) { //...
        const productsList = productsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setProducts(productsList);
        console.log("B. FIRESTORE SE PRODUCTS AAGAYE:", productsList);

        // Sales
        const salesSnapshot = await getDocs(
          collection(db, `users/${currentUser.uid}/sales`)
        );
        const salesList = salesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setSalesHistory(salesList);
      } catch (error) {
        console.error("C. DATA FETCH KARNE MEIN ERROR:", error);
        toast.error("Aapka data load nahi ho saka.");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  /* ----------------------------------------------------------
     Products CRUD – Firestore
  ---------------------------------------------------------- */
    const handleAddProduct = useCallback(async (productToAdd) => {
    if (!currentUser) return;
    try {
      const docRef = await addDoc(
        collection(db, `users/${currentUser.uid}/products`),
        productToAdd
      );
      setProducts(prev => [...prev, { id: docRef.id, ...productToAdd }]);
      toast.success("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product.");
    }
  }, [currentUser]);

  // --- NEW: Customer Management Functions ---

const handleAddCustomer = useCallback(async (customerToAdd) => {
  if (!currentUser) return;
  try {
    const docRef = await addDoc(collection(db, `users/${currentUser.uid}/customers`), customerToAdd);
    setCustomers(prev => [...prev, { id: docRef.id, ...customerToAdd }]);
    toast.success("Customer added successfully!");
  } catch (error) {
    console.error("Error adding customer:", error);
    toast.error("Failed to add customer.");
  }
}, [currentUser]);

const handleUpdateCustomer = useCallback(async (updatedCustomer) => {
  if (!currentUser) return;
  const { id, ...customerData } = updatedCustomer;
  if (!id) return toast.error("Customer ID is missing.");
  
  try {
    const customerDocRef = doc(db, `users/${currentUser.uid}/customers`, id);
    await updateDoc(customerDocRef, customerData);
    setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
    toast.success("Customer updated successfully!");
  } catch (error) {
    console.error("Error updating customer:", error);
    toast.error("Failed to update customer.");
  }
}, [currentUser]);

const handleDeleteCustomer = useCallback(async (customerIdToDelete) => {
  if (!currentUser) return;
  try {
    await deleteDoc(doc(db, `users/${currentUser.uid}/customers`, customerIdToDelete));
    setCustomers(prev => prev.filter(c => c.id !== customerIdToDelete));
    toast.success("Customer deleted successfully!");
  } catch (error) {
    console.error("Error deleting customer:", error);
    toast.error("Failed to delete customer.");
  }
}, [currentUser]);
  const handleUpdateProduct = useCallback(async (updatedProduct) => {
    if (!currentUser) return;
    const { id, ...productData } = updatedProduct;
    if (!id) {
        toast.error("Product ID is missing. Cannot update.");
        return;
    }

    try {
      const productDocRef = doc(db, `users/${currentUser.uid}/products`, id);
      await updateDoc(productDocRef, productData);
      setProducts(prev => prev.map(p => (p.id === id ? updatedProduct : p)));
      toast.success("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product.");
    }
  }, [currentUser]);

  const handleDeleteProduct = useCallback(async (productId) => {
    if (!currentUser) return;
    // Note: The confirmation prompt was moved to the Inventory component for better UI feedback.
    // If you prefer it here, you can uncomment the next line.
    // if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/products`, productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product.");
    }
  }, [currentUser]);

  /* ----------------------------------------------------------
     Sales Handling
  ---------------------------------------------------------- */
  const handleProcessSale = useCallback(async (saleRecord) => {
    if (!currentUser) return;
    try {
      const docRef = await addDoc(
        collection(db, `users/${currentUser.uid}/sales`),
        saleRecord
      );
      setSalesHistory(prev => [...prev, { id: docRef.id, ...saleRecord }]);
      toast.success("Sale recorded successfully!");
      // Advanced: Here you would also update the stock for each product sold.
    } catch (error) {
      console.error("Error processing sale:", error);
      toast.error("Failed to record sale.");
    }
  }, [currentUser]);

  /* ----------------------------------------------------------
     Clear ALL data (using a batch delete for efficiency)
  ---------------------------------------------------------- */
  const handleClearAllData = useCallback(async () => {
    if (!currentUser) return;

    const confirmationText = "DELETE";
    const userInput = prompt(`This action is irreversible and will delete all products and sales. To confirm, please type: ${confirmationText}`);

    if (userInput !== confirmationText) {
      if (userInput !== null) { // User clicked OK but didn't type correctly
        toast.error("Confirmation text did not match. Action cancelled.");
      }
      return;
    }

    toast.loading("Clearing all data...");
    try {
      const batch = writeBatch(db);

      // Get all products to delete
      const productsSnapshot = await getDocs(
        collection(db, `users/${currentUser.uid}/products`)
      );
      productsSnapshot.forEach(document => batch.delete(document.ref));

      // Get all sales to delete
      const salesSnapshot = await getDocs(
        collection(db, `users/${currentUser.uid}/sales`)
      );
      salesSnapshot.forEach(document => batch.delete(document.ref));

      // Commit the batch delete
      await batch.commit();

      toast.dismiss(); // Dismiss the "loading" toast
      toast.success("All data has been successfully cleared.");
      
      // Clear local state
      setProducts([]);
      setSalesHistory([]);

    } catch (error) {
      toast.dismiss(); // Dismiss the "loading" toast
      console.error("Error clearing all data:", error);
      toast.error("Failed to clear data.");
    }
  }, [currentUser]);

  /* ----------------------------------------------------------
     Loading state
  ---------------------------------------------------------- */
  if (dataLoading) return <LoadingSpinner />;

  /* ----------------------------------------------------------
     Render
  ---------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow animate-fade-in-up" key={activeTab}>
        {activeTab === 'dashboard'   && <Dashboard products={products} salesHistory={salesHistory} />}
        {activeTab === 'pos'         && (
          <POS
            products={products}
            onProcessSale={handleProcessSale}
            cart={cart}
            setCart={setCart}
          />
        )}
        {activeTab === 'inventory'   && (
          <Inventory
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
        {activeTab === 'sales report' && <SalesReport salesHistory={salesHistory} />}
        {activeTab === 'settings'     && <Settings onClearData={handleClearAllData} />}
		{activeTab === 'inventory' && <Inventory ... />}

{/* YEH NAYA CODE ADD KAREIN */}
{activeTab === 'customers' && 
  <Customers 
    customers={customers}
    onAddCustomer={handleAddCustomer}
    onUpdateCustomer={handleUpdateCustomer}
    onDeleteCustomer={handleDeleteCustomer}
  />
}

{activeTab === 'sales report' && <SalesReport ... />}
      </main>
      <Footer />
    </div>
  );
}

/* ----------------------------------------------------------
   Root App
---------------------------------------------------------- */
export default function App() {
  const { currentUser, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{ style: { background: '#333', color: '#fff' } }}
      />
      {currentUser ? <MainApp /> : <Login />}
    </>
  );
}