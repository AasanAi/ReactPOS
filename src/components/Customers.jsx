import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

function Customers({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onReceivePayment }) {
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

    if (editingCustomer) {
      onUpdateCustomer({ ...newCustomer, id: editingCustomer.id });
    } else {
      onAddCustomer({ ...newCustomer, dueBalance: 0 });
    }

    setNewCustomer({ name: "", phone: "", address: "" });
    setEditingCustomer(null);
  };

  const handleEditClick = (customer) => {
    setEditingCustomer(customer);
    setNewCustomer({ name: customer.name, phone: customer.phone, address: customer.address });
  };

  const handleCancelEdit = () => {
    setNewCustomer({ name: "", phone: "", address: "" });
    setEditingCustomer(null);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      onDeleteCustomer(id);
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
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (amount > Number(payingCustomer.dueBalance)) {
      toast.error("Amount cannot be greater than the due balance.");
      return;
    }

    onReceivePayment(payingCustomer.id, amount);
    closePaymentModal();
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <input
            type="text"
            placeholder="Name"
            className="mb-2 w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Phone"
            className="mb-2 w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
          />
          <input
            type="text"
            placeholder="Address"
            className="mb-4 w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleFormSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {editingCustomer ? "Update" : "Add"}
            </button>
            {editingCustomer && (
              <button
                onClick={handleCancelEdit}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Customer List Section */}
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
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">{c.name}</td>
                    <td>{c.phone}</td>
                    <td className="font-semibold text-red-500">
                      PKR {Number(c.dueBalance).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => openPaymentModal(c)}
                        className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600"
                      >
                        Payment
                      </button>
                      <button
                        onClick={() => handleEditClick(c)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(c.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
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
              Current Due:{" "}
              <span className="font-bold text-red-500">
                PKR {Number(payingCustomer.dueBalance).toFixed(2)}
              </span>
            </p>
            <label
              htmlFor="paymentAmount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
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
