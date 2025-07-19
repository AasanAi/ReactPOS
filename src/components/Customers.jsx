// src/components/Customers.jsx

import React, { useState } from 'react';
import toast from 'react-hot-toast';

function Customers({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) {
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", address: "" });
  const [editingCustomer, setEditingCustomer] = useState(null);

  const handleFormSubmit = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Customer Name and Phone are required!");
      return;
    }

    if (editingCustomer) {
      onUpdateCustomer(newCustomer); // newCustomer state mein 'id' bhi hogi
    } else {
      // Shuru mein har naye customer ka due balance 0 hoga
      onAddCustomer({ ...newCustomer, dueBalance: 0 });
    }

    // Form ko reset karein
    setNewCustomer({ name: "", phone: "", address: "" });
    setEditingCustomer(null);
  };

  const handleEditClick = (customerToEdit) => {
    setEditingCustomer(customerToEdit);
    setNewCustomer(customerToEdit);
  };

  const handleCancelEdit = () => {
    setNewCustomer({ name: "", phone: "", address: "" });
    setEditingCustomer(null);
  };

  const handleDeleteClick = (customerId) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      onDeleteCustomer(customerId);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Add/Edit Form */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
              <input id="customerName" type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
              <input id="customerPhone" type="text" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address (Optional)</label>
              <input id="customerAddress" type="text" value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div className="flex space-x-2 mt-6">
            <button onClick={handleFormSubmit} className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg">
              {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </button>
            {editingCustomer && (
              <button onClick={handleCancelEdit} className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors">Cancel</button>
            )}
          </div>
        </div>

        {/* Customer List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Customer List</h3>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Due Balance</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{customer.name}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{customer.phone}</td>
                    <td className="px-4 py-3 font-semibold text-red-500 dark:text-red-400">PKR {customer.dueBalance.toFixed(2)}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => handleEditClick(customer)} className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors">Edit</button>
                      <button onClick={() => handleDeleteClick(customer.id)} className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors">Delete</button>
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

export default Customers;