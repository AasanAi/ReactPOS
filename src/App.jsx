import React, { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

// NEW: Firestore se functions aur db config ko import karein
import { db } from './firebase.js'; 
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";

// Components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import SalesReport from './components/SalesReport';
import Settings from './components/Settings';
import Footer from './components/Footer';
import Login from './components/Login';
import LoadingSpinner from "./components/LoadingSpinner";

function MainApp() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // CHANGED: State ab khaali (empty) se shuru hoga. Data Firestore se aayega.
  const [products, setProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [cart, setCart] = useState([]);

  // NEW: Ek naya loading state, jab data Firestore se aa raha ho.
  const [dataLoading, setDataLoading] = useState(true);

  // NEW: Firestore se data fetch karne ke liye useEffect. Yeh user login hone par chalega.
  useEffect(() => {
    if (!currentUser) return; // Agar user login nahi hai, to kuch na karein

    const fetchData = async () => {
      setDataLoading(true);
      try {
        // Step 1: Products fetch karein
        const productsPath = `users/${currentUser.uid}/products`;
        const productsSnapshot = await getDocs(collection(db, productsPath));
        const productsList = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsList);

        // Step 2: Sales History fetch karein
        const salesPath = `users/${currentUser.uid}/sales`;
        const salesSnapshot = await getDocs(collection(db, salesPath));
        const salesList = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSalesHistory(salesList);

      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        toast.error("Aapka data load nahi ho saka.");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [currentUser]); // Yeh effect sirf tab chalega jab user badlega (login/logout).

  // --- NEW: Firestore ke liye badle hue functions ---

  const handleAddProduct = useCallback(async (productToAdd) => {
    alert("NAYA CODE CHAL RAHA HAI! Version 2"); // <-- YEH LINE ADD KAREIN
	if (!currentUser) return;
    try {
      const docRef = await addDoc(collection(db, `users/${currentUser.uid}/products`), productToAdd);
      setProducts(prev => [...prev, { id: docRef.id, ...productToAdd }]); // UI foran update karein
      toast.success("Product add ho gaya!");
    } catch (error) {
      console.error("Error adding product: ", error);
      toast.error("Product add nahi ho saka.");
    }
  }, [currentUser]);

  const handleUpdateProduct = useCallback(async (updatedProduct) => {
    if (!currentUser) return;
    const { id, ...productData } = updatedProduct; // Firestore ID alag kar lein
    if (!id) return toast.error("Product ID nahi hai. Update nahi ho sakta.");
    
    try {
      const productDocRef = doc(db, `users/${currentUser.uid}/products`, id);
      await updateDoc(productDocRef, productData);
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      toast.success("Product update ho gaya!");
    } catch (error) {
      console.error("Error updating product: ", error);
      toast.error("Product update nahi ho saka.");
    }
  }, [currentUser]);

  const handleDeleteProduct = useCallback(async (productIdToDelete) => {
    if (!currentUser) return;
    if (window.confirm("Kya aap waqai is product ko delete karna chahte hain?")) {
      try {
        await deleteDoc(doc(db, `users/${currentUser.uid}/products`, productIdToDelete));
        setProducts(prev => prev.filter(p => p.id !== productIdToDelete));
        toast.success("Product delete ho gaya!");
      } catch (error) {
        console.error("Error deleting product: ", error);
        toast.error("Product delete nahi ho saka.");
      }
    }
  }, [currentUser]);
  
  // NEW: Sales ko handle karne ke liye ek alag function
  const handleProcessSale = useCallback(async (saleRecord, cartItems) => {
    if (!currentUser) return;
    try {
        const saleDocRef = await addDoc(collection(db, `users/${currentUser.uid}/sales`), saleRecord);
        setSalesHistory(prev => [...prev, {id: saleDocRef.id, ...saleRecord}]);
        
        // Advanced: Yahan har product ka stock update karne ka logic bhi aayega.
        // Yeh ek 'transaction' ya 'batch write' se karna behtar hai.

        toast.success("Sale record ho gayi!");
    } catch (error) {
        console.error("Error processing sale: ", error);
        toast.error("Sale record nahi ho saki.");
    }
  }, [currentUser]);


  // CHANGED: localStorage ki jagah Firestore se saara data delete hoga
  const handleClearAllData = useCallback(async () => {
    if (!currentUser) return;
    if (window.confirm("KHATRA: Kya aap waqai cloud se apna saara data (products aur sales) delete karna chahte hain?")) {
      const confirmationText = "DELETE";
      const userInput = prompt(`Yeh action aakhri hoga. Please "${confirmationText}" type karke confirm karein.`);
      if (userInput === confirmationText) {
        toast.loading('Saara data delete ho raha hai...');
        try {
          const batch = writeBatch(db);
          // Delete all products
          const productsSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/products`));
          productsSnapshot.forEach(doc => batch.delete(doc.ref));
          // Delete all sales
          const salesSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/sales`));
          salesSnapshot.forEach(doc => batch.delete(doc.ref));

          await batch.commit(); // Ek saath sab delete karein
          toast.dismiss();
          toast.success("Aapka saara data clear ho chuka hai.");
          setProducts([]);
          setSalesHistory([]);
        } catch (error) {
          toast.dismiss();
          toast.error("Data clear nahi ho saka.");
        }
      } else if (userInput !== null) {
        toast.error("Confirmation text match nahi hua. Action cancel kar diya gaya.");
      }
    }
  }, [currentUser]);

  // NEW: Jab tak data load ho raha hai, spinner dikhayein
  if (dataLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow animate-fade-in-up" key={activeTab}>
        {activeTab === 'dashboard' && <Dashboard products={products} salesHistory={salesHistory} />}
        
        {activeTab === 'pos' && 
          <POS 
            products={products}
            onProcessSale={handleProcessSale} // CHANGED: Naya prop pass karein
            cart={cart}
            setCart={setCart}
          />
        }
        
        {activeTab === 'inventory' && 
          <Inventory 
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct} // Ab isey product.id chahiye, barcode nahi
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      {currentUser ? <MainApp /> : <Login />}
    </>
  );
}