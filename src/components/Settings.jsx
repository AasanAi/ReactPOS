import React from 'react';

function Settings({ onClearData }) {
  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Settings</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Application Data</h3>
        <p className="text-gray-600 mb-4">
          Manage your application's data. Be careful with the options in the danger zone.
        </p>
      </div>

      {/* ===== DANGER ZONE ===== */}
      <div className="mt-8 bg-red-50 border-2 border-dashed border-red-400 p-6 rounded-xl">
        <h3 className="text-xl font-bold text-red-700">Danger Zone</h3>
        <p className="text-red-600 mt-2 mb-4">
          The following action is destructive and cannot be undone. Please be absolutely certain before proceeding.
        </p>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold">Clear All Application Data</p>
            <p className="text-sm text-gray-600">This will permanently delete all products and sales history.</p>
          </div>
          <button 
            onClick={onClearData}
            className="bg-red-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;