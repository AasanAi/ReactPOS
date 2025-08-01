import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

function Customers({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onReceivePayment }) {
  // --- NAYA STATE SEARCH KE LIYE ---
  const [searchTerm, setSearchTerm] = useState("");

  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", address: "" });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [payingCustomer, setPayingCustomer] = useState(null);

  const handleFormSubmit = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Customer Name and Phone are required!");
      return;
    }

    // --- YEH NAYA DEBUGGING CODE HAI ---
    console.log("1. Add Customer button clicked! Data to be sent:", newCustomer);

    if (editingCustomer) {
      onUpdateCustomer(newCustomer);
    } else {
      onAddCustomer({ ...newCustomer, dueBalance: 0 });
    }

  const handleEditClick = (customerToEdit) => {
    setEditingCustomer(customerToEdit);
    setNewCustomer(customerToEdit);
  };

  const handleCancelEdit = () => {
    setNewCustomer({ name: "", phone: "", address: "" });
    setEditingCustomer(null);
  };

  const handleDeleteClick = (customerId) => {
    if (window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      onDeleteCustomer(customerId);
    }
  };

  const openPaymentModal = (customer) => {
    setPayingCustomer(customer);
    setIsPaymentModalOpen(true);
    setPaymentAmount("");
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPayingCustomer(null);
  };

  const handleReceivePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (amount > payingCustomer.dueBalance) {
      toast.error("Amount cannot be greater than the due balance.");
      return;
    }
    onReceivePayment(payingCustomer, amount);
    closePaymentModal();
  };

  // --- NAYI FILTERING LOGIC ---
  const filteredCustomers = (customers || []).filter(customer =>
    (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <div className="space-y-4">
            <div><label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label><input id="customerName" type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label><input id="customerPhone" type="text" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address (Optional)</label><input id="customerAddress" type="text" value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
          </div>
          <div className="flex space-x-2 mt-6"><button onClick={handleFormSubmit} className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg">{editingCustomer ? 'Update Customer' : 'Add Customer'}</button>{editingCustomer && (<button onClick={handleCancelEdit} className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors">Cancel</button>)}</div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Customer List</h3>
          
          {/* --- NAYA SEARCH BAR --- */}
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Phone</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Due Balance</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* --- Ab 'filteredCustomers' ko map karein --- */}
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{customer.name}</td>
                      <td className="px-4 py-3 dark:text-gray-300">{customer.phone}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-500 dark:text-red-400">PKR {customer.dueBalance.toFixed(2)}</td>
                      <td className="px-4 py-3 space-x-2 text-center">
                        <button onClick={() => openPaymentModal(customer)} className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600 transition-colors">Payment</button>
                        <button onClick={() => handleEditClick(customer)} className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors">Edit</button>
                        <button onClick={() => handleDeleteClick(customer.id)} className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors">Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-500 dark:text-gray-400">
                      No customers found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isPaymentModalOpen} 
        onRequestClose={closePaymentModal}
        contentLabel="Receive Payment Modal"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto mt-24"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"
      >
        {payingCustomer && (
          <>
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Receive Payment</h2>
            <p className="dark:text-gray-300 mb-1">Customer: <span className="font-semibold">{payingCustomer.name}</span></p>
            <p className="dark:text-gray-300 mb-4">Current Due: <span className="font-bold text-red-500">PKR {payingCustomer.dueBalance.toFixed(2)}</span></p>
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Received</label>
            <input 
              type="number" 
              id="paymentAmount" 
              value={paymentAmount} 
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus 
            />
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={closePaymentModal} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Cancel</button>
              <button onClick={handleReceivePayment} className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600">Confirm Payment</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default Customers;