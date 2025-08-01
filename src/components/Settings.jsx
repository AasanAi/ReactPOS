import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Naya sub-component, sirf cashiers ki list ke liye
function CashierList({ allUsers, onResetPassword, onToggleUserStatus }) {
  // Sirf cashiers ko filter karo
  const cashiers = allUsers.filter(user => user.role === 'cashier');

  if (cashiers.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 mt-4">No cashier accounts found.</p>;
  }

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Manage Cashiers</h4>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {cashiers.map(user => (
              <tr key={user.uid}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{user.email}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'disabled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {user.status === 'disabled' ? 'Disabled' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-sm space-x-2">
                  <button onClick={() => onResetPassword(user.email)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Reset Password</button>
                  <button onClick={() => onToggleUserStatus(user)} className={`font-semibold ${user.status === 'disabled' ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}>
                    {user.status === 'disabled' ? 'Enable' : 'Disable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function UserManagement({ allUsers, onResetPassword, onToggleUserStatus }) {
  const [email, setEmail] =useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { createCashierAccount } = useAuth(); 

  const handleCreateCashier = async (e) => {
    e.preventDefault();
    if (!email || !password || password.length < 6) {
      toast.error("Email and a password of at least 6 characters are required.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Creating new cashier...");
    try {
      await createCashierAccount(email, password);
      toast.dismiss(toastId);
      toast.success(`Success! New cashier ${email} created.`);
      setEmail(''); setPassword('');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to create cashier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-8">
      <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Create New Cashier</h3>
      <form onSubmit={handleCreateCashier} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Cashier's Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Temporary Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 disabled:bg-teal-400">
          {loading ? 'Creating...' : 'Create Cashier Account'}
        </button>
      </form>
      {/* Nayi cashier list yahan dikhegi */}
      <CashierList allUsers={allUsers} onResetPassword={onResetPassword} onToggleUserStatus={onToggleUserStatus} />
    </div>
  );
}

function Settings({ onClearData, allUsers, onResetPassword, onToggleUserStatus }) {
  const { userRole } = useAuth();

  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Settings</h2>
      {userRole === 'admin' && <UserManagement allUsers={allUsers} onResetPassword={onResetPassword} onToggleUserStatus={onToggleUserStatus} />}
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl mt-8">
        <h3 className="text-xl font-bold text-red-800">Danger Zone</h3>
        <p className="text-red-700 mt-2">Be careful. This action cannot be undone.</p>
        <button onClick={onClearData} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Clear All Data</button>
      </div>
    </div>
  );
}

export default Settings;