// src/components/Inventory.jsx

import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPackage, FiSearch, FiEdit, FiTrash2, FiDownload, FiUpload } from 'react-icons/fi';
import * as XLSX from 'xlsx';

function Inventory({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const [newProduct, setNewProduct] = useState({ name: "", buyPrice: "", salePrice: "", quantity: "", barcode: "", imageUrl: "" });
  const [imagePreview, setImagePreview] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  useEffect(() => {
    if (editingProduct) {
      setNewProduct(editingProduct);
      setImagePreview(editingProduct.imageUrl || "");
    } else {
      handleCancelEdit();
    }
  }, [editingProduct]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB limit
        toast.error("Image file is too large! (Max 500KB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async () => {
    if (!newProduct.name || !newProduct.buyPrice || !newProduct.salePrice || !newProduct.quantity || !newProduct.barcode) {
      toast.error("All fields (except image) are required!");
      return;
    }
    const { id, ...productData } = newProduct;
    
    const dataToSend = {
      ...productData,
      buyPrice: parseFloat(newProduct.buyPrice),
      salePrice: parseFloat(newProduct.salePrice),
      quantity: parseInt(newProduct.quantity),
    };
    
    if (editingProduct) {
      const imagePayload = imagePreview !== editingProduct.imageUrl ? (imagePreview || null) : undefined;
      await onUpdateProduct({ id, ...dataToSend }, imagePayload);
    } else {
      if (products.some((p) => p.barcode === newProduct.barcode)) {
        toast.error("This barcode already exists!");
        return;
      }
      await onAddProduct(dataToSend, imagePreview);
    }
    handleCancelEdit();
  };
  
  const handleEditClick = (productToEdit) => { setEditingProduct(productToEdit); };
  
  const handleCancelEdit = () => {
    setNewProduct({ name: "", buyPrice: "", salePrice: "", quantity: "", barcode: "", imageUrl: "" });
    setEditingProduct(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = null;
  };
  
  const handleDeleteClick = (productId) => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
        onDeleteProduct(productId);
    }
  };

  const exportToCSV = () => {
    if (!products || products.length === 0) {
      toast.error("There are no products to export.");
      return;
    }
    const dataToExport = products.map(p => ({
        Name: p.name, 'Buy Price': p.buyPrice, 'Sale Price': p.salePrice, Quantity: p.quantity, Barcode: p.barcode, 'Image URL': p.imageUrl || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "AasanPOS_Products.xlsx");
  };

  const importFromCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = text.split("\n").slice(1);
        const importedProducts = rows
          .filter(row => row.trim() !== "")
          .map((row) => {
              const [name, buyPrice, salePrice, quantity, barcode] = row.split(",").map(cell => cell.trim());
              return { name, buyPrice: parseFloat(buyPrice), salePrice: parseFloat(salePrice), quantity: parseInt(quantity), barcode };
          })
          .filter(p => p.name && !isNaN(p.buyPrice) && !isNaN(p.salePrice) && !isNaN(p.quantity) && p.barcode && !(products || []).some(prod => prod.barcode === p.barcode));
        if (importedProducts.length === 0) {
          toast.error("No new products found in the file, or all barcodes already exist.");
          return;
        }
        importedProducts.forEach(prod => onAddProduct(prod, null));
        toast.success(`${importedProducts.length} products imported successfully!`);
      } catch (error) {
        toast.error("Failed to import CSV. Please check the file format.");
      }
    };
    reader.readAsText(file);
    if(e.target) e.target.value = null;
  };
  
  const filteredProducts = (products || []).filter(p => (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (p.barcode?.toLowerCase() || '').includes(searchTerm.toLowerCase()));

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-fit">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="my-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Image</label>
            <div className="mt-1 flex items-center space-x-4">
                <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border">
                    {imagePreview ? (<img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />) : (<FiPackage className="w-10 h-10 text-gray-400" />)}
                </div>
                <div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current.click()} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Change</button>
                  {imagePreview && <button type="button" onClick={() => setImagePreview("")} className="mt-2 text-xs text-red-500 hover:underline">Remove</button>}
                </div>
            </div>
          </div>
          <div className="space-y-4">
            <div><label htmlFor="pName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label><input id="pName" type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label htmlFor="bPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buy Price (PKR)</label><input id="bPrice" type="number" value={newProduct.buyPrice} onChange={(e) => setNewProduct({ ...newProduct, buyPrice: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label htmlFor="sPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sale Price (PKR)</label><input id="sPrice" type="number" value={newProduct.salePrice} onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label htmlFor="qty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Quantity</label><input id="qty" type="number" value={newProduct.quantity} onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Barcode</label><input id="barcode" type="text" value={newProduct.barcode} onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })} className={`mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${editingProduct ? 'bg-gray-200 dark:bg-gray-600 cursor-not-allowed' : ''}`} disabled={!!editingProduct} /></div>
          </div>
          <div className="flex space-x-2 mt-6"><button onClick={handleFormSubmit} className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg">{editingProduct ? 'Update Product' : 'Add Product'}</button>{editingProduct && (<button onClick={handleCancelEdit} className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors">Cancel</button>)}</div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Product List</h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button onClick={exportToCSV} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"><FiDownload/>Export CSV</button>
              <button onClick={() => csvInputRef.current.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"><FiUpload/>Import CSV</button>
              <input type="file" accept=".csv" ref={csvInputRef} onChange={importFromCSV} className="hidden" />
            </div>
          </div>
          <input type="text" placeholder="Search by name or barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Image</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Sale Price</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Stock</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"/>
                            ) : (
                                <FiPackage className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{product.name}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">PKR {(product.salePrice || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{product.quantity}</td>
                    <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleEditClick(product)} className="text-blue-500 hover:text-blue-700 p-1"><FiEdit /></button>
                        <button onClick={() => handleDeleteClick(product.id)} className="text-red-500 hover:text-red-700 p-1"><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Inventory;