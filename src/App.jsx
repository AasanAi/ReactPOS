import React, { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
// YEH SAHI AUR MUKAMMAL IMPORT HAI
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  increment // <-- Naya function yahan add ho gaya hai
} from "firebase/firestore";

// Component Imports
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

function MainApp() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // All application state is managed here
  const [products, setProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch all data from Firestore when the user logs in
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        // Fetch Products
        const productsSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/products`));
        setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Sales
        const salesSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/sales`));
        setSalesHistory(salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Customers
        const customersSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/customers`));
        setCustomers(customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load your data. Please try again.");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  /* --- Product Management --- */
  const handleAddProduct = useCallback(async (productToAdd) => {
    if (!currentUser) return;
    try {
      const docRef = await addDoc(collection(db, `users/${currentUser.uid}/products`), productToAdd);
      setProducts(prev => [...prev, { id: docRef.id, ...productToAdd }]);
      toast.success("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product.");
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
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/products`, productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product.");
    }
  }, [currentUser]);

  /* --- Customer Management --- */
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

  /* --- Sales & Data Management --- */
  // App.jsx ke andar...

// Yeh purana handleProcessSale function hoga... use is NAYE WALE se badal dein
const handleProcessSale = useCallback(async (saleData) => {
  if (!currentUser) return;

  const { saleRecord, customerId } = saleData; // saleData mein ab customerId bhi aayega
  let saleToSave = { ...saleRecord };

  try {
    // Agar koi customer select hua hai (Walk-in nahi)
    if (customerId !== 'walk-in') {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        saleToSave.customerId = customerId;
        saleToSave.customerName = customer.name;
      }

      const dueAmount = saleRecord.totalAmount - saleRecord.amountPaid;

      // Agar udhaar hai, to customer ka dueBalance update karein
      if (dueAmount > 0) {
        const customerDocRef = doc(db, `users/${currentUser.uid}/customers`, customerId);
        // increment() istemal karein taaki data sync rahe
        await updateDoc(customerDocRef, {
          dueBalance: increment(dueAmount)
        });
        // Local state ko bhi update karein taaki foran UI par dikhe
        setCustomers(prev => prev.map(c => 
          c.id === customerId ? { ...c, dueBalance: c.dueBalance + dueAmount } : c
        ));
      }
    }

    // Sale ko Firestore mein save karein
    const docRef = await addDoc(
      collection(db, `users/${currentUser.uid}/sales`),
      saleToSave
    );
    setSalesHistory(prev => [...prev, { id: docRef.id, ...saleToSave }]);
    toast.success("Sale recorded successfully!");

  } catch (error) {
    console.error("Error processing sale:", error);
    toast.error("Failed to record sale.");
  }
}, [currentUser, customers]); // Ab yeh customers state par bhi depend karta hai

  const handleClearAllData = useCallback(async () => {
    if (!currentUser) return;
    const confirmationText = "DELETE";
    const userInput = prompt(`This will delete all products, sales, and customers. To confirm, type: ${confirmationText}`);

    if (userInput !== confirmationText) {
      if (userInput !== null) {
        toast.error("Confirmation text did not match. Action cancelled.");
      }
      return;
    }

    toast.loading("Clearing all data...");
    try {
      const batch = writeBatch(db);

      const collectionsToDelete = ['products', 'sales', 'customers'];
      for (const collectionName of collectionsToDelete) {
        const snapshot = await getDocs(collection(db, `users/${currentUser.uid}/${collectionName}`));
        snapshot.forEach(document => batch.delete(document.ref));
      }

      await batch.commit();
      toast.dismiss();
      toast.success("All data has been successfully cleared.");
      
      setProducts([]);
      setSalesHistory([]);
      setCustomers([]);
    } catch (error) {
      toast.dismiss();
      console.error("Error clearing all data:", error);
      toast.error("Failed to clear data.");
    }
  }, [currentUser]);

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
    customers={customers} // <-- YEH NAYI LINE ADD KAREIN
    onProcessSale={handleProcessSale}
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

        {activeTab === 'customers' && 
          <Customers 
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        }
        
        {activeTab === 'sales report' && <SalesReport salesHistory={salesHistory} />}
        
        {activeTab === 'settings' && <Settings onClearData={handleClearAllData} />}

      </main>
      <Footer />
    </div>
  );
}

// --- Root App Entry Point ---
export default function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

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