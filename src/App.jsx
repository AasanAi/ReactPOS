import React, { useState, useEffect } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

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

  const [products, setProducts] = useState(() => {
    if (currentUser) {
      try {
        const saved = localStorage.getItem(`aasanPosProducts_${currentUser.uid}`);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Error loading products from storage:", e);
      }
    }
    return [];
  });

  const [salesHistory, setSalesHistory] = useState(() => {
    if (currentUser) {
      try {
        const saved = localStorage.getItem(`aasanPosSales_${currentUser.uid}`);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Error loading sales from storage:", e);
      }
    }
    return [];
  });

  const [cart, setCart] = useState([]);

  // Save products to localStorage on change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`aasanPosProducts_${currentUser.uid}`, JSON.stringify(products));
    }
  }, [products, currentUser]);

  // Save sales history to localStorage on change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`aasanPosSales_${currentUser.uid}`, JSON.stringify(salesHistory));
    }
  }, [salesHistory, currentUser]);

  const handleAddProduct = (productToAdd) => {
    setProducts(prevProducts => [...prevProducts, productToAdd]);
  };

  const handleDeleteProduct = (barcodeToDelete) => {
    if (window.confirm("Are you sure?")) {
      setProducts(products.filter(p => p.barcode !== barcodeToDelete));
      toast.success("Product deleted!");
    }
  };

  const handleUpdateProduct = (updatedProduct) => {
    setProducts(products.map(p => p.barcode === updatedProduct.barcode ? updatedProduct : p));
  };

  const handleClearAllData = () => {
    if (currentUser && window.confirm("DANGER: Are you sure you want to delete ALL your data?")) {
      const confirmationText = "DELETE";
      const userInput = prompt(`This is irreversible. Please type "${confirmationText}" to confirm.`);
      if (userInput === confirmationText) {
        localStorage.removeItem(`aasanPosProducts_${currentUser.uid}`);
        localStorage.removeItem(`aasanPosSales_${currentUser.uid}`);
        window.location.reload();
      } else if (userInput !== null) {
        alert("Confirmation text did not match. Action cancelled.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow animate-fade-in-up" key={activeTab}>
        {activeTab === 'dashboard' && <Dashboard products={products} salesHistory={salesHistory} />}
        
        {activeTab === 'pos' && 
          <POS 
            products={products}
            setProducts={setProducts}
            setSalesHistory={setSalesHistory}
            cart={cart}
            setCart={setCart}
          />
        }
        
        {activeTab === 'inventory' && 
          <Inventory 
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
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
