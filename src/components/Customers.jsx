// src/components/Customers.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

function Customers({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onReceivePayment }) {
  const [searchTerm, setSearchTerm] = useState("");
  // --- NAYA: 'dueBalance' state mein shamil kiya gaya hai ---
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", address: "", note: "", dueBalance: 0 });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [payingCustomer, setPayingCustomer] = useState(null);
  // --- NAYA: State for View Customer Modal ---
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  // --- NAYA: State for Edit Note Modal ---
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [editNoteCustomer, setEditNoteCustomer] = useState(null);
  const [newNote, setNewNote] = useState("");

  const handleFormSubmit = () => {
  if (!newCustomer.name || !newCustomer.phone) {
    toast.error("Customer Name and Phone are required!");
    return;
  }

  // --- NAYA: dueBalance ko number mein convert karo ---
  const customerDataToSend = {
    ...newCustomer,
    dueBalance: parseFloat(newCustomer.dueBalance) || 0 // Ensure dueBalance is a number
  };

  if (editingCustomer) {
    // --- UPDATED: onUpdateCustomer ko poora customer object bhejo, INCLUDING `id` ---
    // Yeh line change ki gayi hai
    // OLD: onUpdateCustomer(customerDataToSend);
    // NEW:
    onUpdateCustomer({ ...editingCustomer, ...customerDataToSend });
    // `editingCustomer` میں `id` ہوتا ہے، اور ہم نیا ڈیٹا بھی شامل کر رہے ہیں
    // اس طرح `id` بھی `handleUpdateCustomer` کو مل جائے گی۔
  } else {
    // For new customer
    onAddCustomer({ ...customerDataToSend, dueBalance: 0, note: customerDataToSend.note || "" });
  }
  // --- NAYA: 'dueBalance' ko bhi reset karo ---
  setNewCustomer({ name: "", phone: "", address: "", note: "", dueBalance: 0 });
  setEditingCustomer(null);
};

  const handleEditClick = (customerToEdit) => {
    setEditingCustomer(customerToEdit);
    // Populate the form with customer data, including note and dueBalance
    setNewCustomer({
      name: customerToEdit.name || "",
      phone: customerToEdit.phone || "",
      address: customerToEdit.address || "",
      note: customerToEdit.note || "",
      // --- NAYA: dueBalance ko bhi set karo ---
      dueBalance: customerToEdit.dueBalance || 0
    });
  };

  const handleCancelEdit = () => {
    // --- NAYA: 'dueBalance' ko bhi reset karo ---
    setNewCustomer({ name: "", phone: "", address: "", note: "", dueBalance: 0 });
    setEditingCustomer(null);
  };

  const handleDeleteClick = (customerId) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      onDeleteCustomer(customerId);
    }
  };

  // --- NAYA: Function to open View Customer Modal ---
  const openViewModal = (customer) => {
    setViewingCustomer(customer);
    setIsViewModalOpen(true);
  };

  // --- NAYA: Function to close View Customer Modal ---
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingCustomer(null);
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

  // --- NAYA: Function to open Edit Note Modal ---
  const openEditNoteModal = (customer) => {
    setEditNoteCustomer(customer);
    setNewNote(customer.note || ""); // Pre-fill with existing note
    setIsEditNoteModalOpen(true);
    closeViewModal(); // Close view modal when opening edit note
  };

  // --- NAYA: Function to close Edit Note Modal ---
  const closeEditNoteModal = () => {
    setIsEditNoteModalOpen(false);
    setEditNoteCustomer(null);
    setNewNote("");
  };

  // --- NAYA: Function to save the edited note ---
  const handleSaveNote = () => {
    if (editNoteCustomer) {
      // Call onUpdateCustomer with the updated note
      onUpdateCustomer({ ...editNoteCustomer, note: newNote });
      toast.success("Customer note updated!");
      closeEditNoteModal();
      // Re-open the view modal to show updated note
      openViewModal({ ...editNoteCustomer, note: newNote });
    }
  };

  const filteredCustomers = (customers || []).filter(customer =>
    (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Add/Edit Customer Form --- */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
              <input
                id="customerName"
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
              <input
                id="customerPhone"
                type="text"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address (Optional)</label>
              <input
                id="customerAddress"
                type="text"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {/* --- NAYA: Note Input Field --- */}
            <div>
              <label htmlFor="customerNote" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Note (Optional)</label>
              <textarea
                id="customerNote"
                value={newCustomer.note}
                onChange={(e) => setNewCustomer({ ...newCustomer, note: e.target.value })}
                className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows="3"
                placeholder="e.g., Bought potatoes and onions, 5% discount next time..."
              />
            </div>
            {/* --- NAYA: Due Balance Input Field (صرف ترمیم کے وقت) --- */}
            {editingCustomer && (
              <div>
                <label htmlFor="customerDueBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Balance (PKR)</label>
                <input
                  id="customerDueBalance"
                  type="number"
                  value={newCustomer.dueBalance}
                  onChange={(e) => setNewCustomer({ ...newCustomer, dueBalance: e.target.value })} // Keep as string for input
                  className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                  Warning: Manually changing the due balance can affect data accuracy. Use with caution.
                </p>
              </div>
            )}
            {/* --- END NAYA --- */}
          </div>
          <div className="flex space-x-2 mt-6">
            <button
              onClick={handleFormSubmit}
              className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg"
            >
              {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </button>
            {editingCustomer && (
              <button
                onClick={handleCancelEdit}
                className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* --- Customer List --- */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Customer List</h3>
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
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {/* --- NAYA: Make customer name clickable to view details --- */}
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-100 hover:text-teal-500 cursor-pointer underline" onClick={() => openViewModal(customer)}>
                        {customer.name}
                      </td>
                      {/* --- END NAYA --- */}
                      <td className="px-4 py-3 dark:text-gray-300">{customer.phone}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-500 dark:text-red-400">
                        PKR {customer.dueBalance.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 space-x-2 text-center">
                        <button
                          onClick={() => openPaymentModal(customer)}
                          className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600 transition-colors"
                        >
                          Payment
                        </button>
                        <button
                          onClick={() => handleEditClick(customer)}
                          className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(customer.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                        {/* --- NAYA: View button (optional, name is also clickable) --- */}
                        <button
                          onClick={() => openViewModal(customer)}
                          className="bg-indigo-500 text-white px-3 py-1 rounded-md text-xs hover:bg-indigo-600 transition-colors"
                        >
                          View
                        </button>
                        {/* --- END NAYA --- */}
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

      {/* --- NAYA: View Customer Modal --- */}
      <Modal
        isOpen={isViewModalOpen}
        onRequestClose={closeViewModal}
        contentLabel="View Customer Details"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto mt-24"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"
      >
        {viewingCustomer && (
          <>
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Customer Details</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>Name:</strong> {viewingCustomer.name}</p>
              <p><strong>Phone:</strong> {viewingCustomer.phone}</p>
              {viewingCustomer.address && <p><strong>Address:</strong> {viewingCustomer.address}</p>}
              <p><strong>Due Balance:</strong> <span className="font-semibold text-red-500 dark:text-red-400">PKR {viewingCustomer.dueBalance.toFixed(2)}</span></p>
              {/* --- NAYA: Display Customer Note --- */}
              <div>
                <strong>Note:</strong>
                {viewingCustomer.note ? (
                  <p className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded whitespace-pre-wrap">{viewingCustomer.note}</p>
                ) : (
                  <p className="mt-1 text-gray-500 dark:text-gray-400 italic">No note available.</p>
                )}
              </div>
              {/* --- END NAYA --- */}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              {/* --- NAYA: Edit Note Button --- */}
              <button
                onClick={() => openEditNoteModal(viewingCustomer)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Edit Note
              </button>
              <button
                onClick={closeViewModal}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>
      {/* --- END NAYA: View Customer Modal --- */}

      {/* --- NAYA: Edit Note Modal --- */}
      <Modal
        isOpen={isEditNoteModalOpen}
        onRequestClose={closeEditNoteModal}
        contentLabel="Edit Customer Note"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto mt-24"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"
      >
        {editNoteCustomer && (
          <>
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Edit Note for {editNoteCustomer.name}</h2>
            <div className="mb-4">
              <label htmlFor="editCustomerNote" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Note
              </label>
              <textarea
                id="editCustomerNote"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows="4"
                placeholder="Enter customer note..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeEditNoteModal}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Save Note
              </button>
            </div>
          </>
        )}
      </Modal>
      {/* --- END NAYA: Edit Note Modal --- */}

      {/* --- Payment Modal (No Change) --- */}
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
            <p className="dark:text-gray-300 mb-1">
              Customer: <span className="font-semibold">{payingCustomer.name}</span>
            </p>
            <p className="dark:text-gray-300 mb-4">
              Current Due: <span className="font-bold text-red-500">PKR {payingCustomer.dueBalance.toFixed(2)}</span>
            </p>
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount Received
            </label>
            <input
              type="number"
              id="paymentAmount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={closePaymentModal}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleReceivePayment}
                className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600"
              >
                Confirm Payment
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default Customers;
