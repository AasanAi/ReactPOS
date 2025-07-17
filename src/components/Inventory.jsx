import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

function Inventory({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  // State waghera mein koi change nahi
  const [newProduct, setNewProduct] = useState({ name: "", buyPrice: "", salePrice: "", quantity: "", barcode: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null); // editingBarcode se editingProduct kiya, taaki poora object save ho
  const fileInputRef = useRef(null);

  const handleFormSubmit = () => {
    if (!newProduct.name || !newProduct.buyPrice || !newProduct.salePrice || !newProduct.quantity || !newProduct.barcode) {
      toast.error("Saare fields zaroori hain!");
      return;
    }
    const productData = { ...newProduct, buyPrice: parseFloat(newProduct.buyPrice), salePrice: parseFloat(newProduct.salePrice), quantity: parseInt(newProduct.quantity) };
    
    if (editingProduct) {
      // Update karte waqt, hum newProduct state se hi poora object bhej rahe hain, jismein 'id' bhi hai.
      onUpdateProduct(newProduct);
      toast.success("Product update ho gaya!");
    } else {
      if (products.some((p) => p.barcode === newProduct.barcode)) {
        toast.error("Yeh Barcode pehle se maujood hai!");
        return;
      }
      onAddProduct(productData);
      // Add ke baad, 'onAddProduct' App.jsx mein Firestore call karega.
    }
    setNewProduct({ name: "", buyPrice: "", salePrice: "", quantity: "", barcode: "" });
    setEditingProduct(null);
  };
  
  const handleEditClick = (productToEdit) => {
    setEditingProduct(productToEdit); // Ab poora product object save karein
    setNewProduct(productToEdit);    // Form ko is object se fill karein
  };
  
  const handleCancelEdit = () => {
    setNewProduct({ name: "", buyPrice: "", salePrice: "", quantity: "", barcode: "" });
    setEditingProduct(null);
  };

  // --- CHANGED ---
  // Ab function ko barcode ki jagah Firestore ki 'id' chahiye.
  const handleDeleteClick = (productId) => {
    onDeleteProduct(productId);
  };

  // Export/Import mein koi change nahi, kyunki yeh sirf data se deal kar raha hai,
  // aur onAddProduct prop abhi bhi aakhir mein kaam kar raha hai.
  const exportToCSV = () => {
    if (!products || products.length === 0) { toast.error("Export karne ke liye koi product nahi hai."); return; }
    const csvRows = [["Name", "Buy Price", "Sale Price", "Quantity", "Barcode"], ...products.map((p) => [p.name, p.buyPrice, p.salePrice, p.quantity, p.barcode])].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvRows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a"); a.setAttribute("href", url); a.setAttribute("download", "AasanPOS_Products.csv"); document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
  };

  const importFromCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = text.split("\n").slice(1);
        const importedProducts = rows.filter(row => row.trim() !== "").map((row) => { const [name, buyPrice, salePrice, quantity, barcode] = row.split(","); return { name: name ? name.trim() : "", buyPrice: parseFloat(buyPrice), salePrice: parseFloat(salePrice), quantity: parseInt(quantity), barcode: barcode ? barcode.trim() : "", }; }).filter(p => p.name && !isNaN(p.buyPrice) && !isNaN(p.salePrice) && !isNaN(p.quantity) && p.barcode && !(products || []).some(prod => prod.barcode === p.barcode));
        if (importedProducts.length === 0) { toast.error("File mein koi naya product nahi mila, ya barcodes pehle se maujood hain."); return; }
        importedProducts.forEach(prod => onAddProduct(prod));
        toast.success(`${importedProducts.length} products import ho gaye!`);
      } catch (error) { toast.error("CSV import nahi ho saki. File format check karein."); console.error("CSV Import Error:", error); }
    };
    reader.readAsText(file);
    e.target.value = null;
  };
  
  const filteredProducts = (products || []).filter(product => 
    (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">{editingProduct ? 'Product Edit Karein' : 'Naya Product Add Karein'}</h3>
          <div className="space-y-4">
            <div><label htmlFor="productName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label><input id="productName" type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label htmlFor="buyPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buy Price (PKR)</label><input id="buyPrice" type="number" value={newProduct.buyPrice} onChange={(e) => setNewProduct({ ...newProduct, buyPrice: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sale Price (PKR)</label><input id="salePrice" type="number" value={newProduct.salePrice} onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Quantity</label><input id="quantity" type="number" value={newProduct.quantity} onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Barcode</label><input id="barcode" type="text" value={newProduct.barcode} onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })} className={`mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${editingProduct ? 'bg-gray-200 dark:bg-gray-600 cursor-not-allowed' : ''}`} disabled={!!editingProduct} /></div>
          </div>
          <div className="flex space-x-2 mt-6"><button onClick={handleFormSubmit} className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg">{editingProduct ? 'Update Product' : 'Add Product'}</button>{editingProduct && (<button onClick={handleCancelEdit} className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors">Cancel</button>)}</div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4"><h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Product List</h3><div className="space-x-2"><button onClick={exportToCSV} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold">Export CSV</button><button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold">Import CSV</button><input type="file" accept=".csv" ref={fileInputRef} onChange={importFromCSV} className="hidden" /></div></div>
          <input type="text" placeholder="Search by name or barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
          <div className="overflow-x-auto max-h-[60vh]"><table className="min-w-full table-auto text-sm"><thead className="bg-gray-100 dark:bg-gray-700 sticky top-0"><tr><th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Name</th><th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Sale Price</th><th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Stock</th><th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{filteredProducts.map((product) => (
            // --- CHANGED ---
            // Ab key ke liye Firestore ki 'id' use hogi, jo zyada reliable hai.
            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{product.name}</td>
              <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">PKR {product.salePrice.toFixed(2)}</td>
              <td className="px-4 py-3 dark:text-gray-300">{product.quantity}</td>
              <td className="px-4 py-3 space-x-2">
                <button onClick={() => handleEditClick(product)} className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors">Edit</button>
                {/* --- CHANGED --- */}
                {/* Ab delete ke liye 'product.id' bheja jayega */}
                <button onClick={() => handleDeleteClick(product.id)} className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors">Delete</button>
              </td>
            </tr>
          ))}</tbody></table></div>
        </div>
      </div>
    </div>
  );
}
export default Inventory;