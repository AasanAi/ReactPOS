import React, { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

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
    console.log("1. PRODUCT ADD KARNE KI KOSHISH...");
    console.log("Data to be added:", productToAdd);
    console.log("User ID:", currentUser.uid);

    try {
      const docRef = await addDoc(
        collection(db, `users/${currentUser.uid}/products`),
        productToAdd
      );
      console.log("2. Product Firestore mein add ho gaya. Doc ID:", docRef.id);
      setProducts(prev => [...prev, { id: docRef.id, ...productToAdd }]);
      toast.success("Product add ho gaya!");
    } catch (error) {
      console.error("3. Product add nahi ho saka:", error);
      toast.error("Product add nahi ho saka.");
    }
  }, [currentUser]);

  const handleUpdateProduct = useCallback(async (updatedProduct) => {
    if (!currentUser) return;
    const { id, ...productData } = updatedProduct;
    if (!id) return toast.error("Product ID nahi hai. Update nahi ho sakta.");

    try {
      const productDocRef = doc(db, `users/${currentUser.uid}/products`, id);
      await updateDoc(productDocRef, productData);
      setProducts(prev => prev.map(p => (p.id === id ? updatedProduct : p)));
      toast.success("Product update ho gaya!");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Product update nahi ho saka.");
    }
  }, [currentUser]);

  const handleDeleteProduct = useCallback(async (productId) => {
    if (!currentUser) return;
    if (!window.confirm("Delete karna hai?")) return;

    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/products`, productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success("Product delete ho gaya!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Product delete nahi ho saka.");
    }
  }, [currentUser]);

  /* ----------------------------------------------------------
     Sales
  ---------------------------------------------------------- */
  const handleProcessSale = useCallback(async (saleRecord) => {
    if (!currentUser) return;
    try {
      const docRef = await addDoc(
        collection(db, `users/${currentUser.uid}/sales`),
        saleRecord
      );
      setSalesHistory(prev => [...prev, { id: docRef.id, ...saleRecord }]);
      toast.success("Sale record ho gayi!");
    } catch (error) {
      console.error("Error processing sale:", error);
      toast.error("Sale record nahi ho saki.");
    }
  }, [currentUser]);

  /* ----------------------------------------------------------
     Clear ALL data (batch delete)
  ---------------------------------------------------------- */
  const handleClearAllData = useCallback(async () => {
    if (!currentUser) return;

    const confirmation = "DELETE";
    const userInput = prompt(`Type "${confirmation}" to confirm`);
    if (userInput !== confirmation) return;

    toast.loading("Deleting everything...");
    try {
      const batch = writeBatch(db);

      // Products
      const prods = await getDocs(
        collection(db, `users/${currentUser.uid}/products`)
      );
      prods.forEach(d => batch.delete(d.ref));

      // Sales
      const sales = await getDocs(
        collection(db, `users/${currentUser.uid}/sales`)
      );
      sales.forEach(d => batch.delete(d.ref));

      await batch.commit();
      toast.dismiss();
      toast.success("Saara data clear ho chuka hai.");
      setProducts([]);
      setSalesHistory([]);
    } catch (error) {
      toast.dismiss();
      toast.error("Data clear nahi ho saka.");
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