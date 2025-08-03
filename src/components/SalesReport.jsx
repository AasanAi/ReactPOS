// src/components/SalesReport.jsx

import React, { useState, useRef } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { utils, writeFile } from 'xlsx';
import { FaTrashAlt } from 'react-icons/fa';
import { FiPrinter, FiDownload, FiX } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import ModernReceipt from './ModernReceipt'; // Naya receipt component import karein

function SalesReport({ salesHistory, onDeleteSale, onDeleteFilteredSales }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSale, setSelectedSale] = useState(null);
  const receiptRef = useRef();

  if (!salesHistory) {
    return <div className="text-center p-10 dark:text-gray-400">Loading sales report...</div>;
  }

  // Filter, Delete, Export functions (no changes here)
  const filteredSales = salesHistory.filter(/* ... */);
  const handleDeleteFiltered = () => { /* ... */ };
  const exportCSV = (data) => { /* ... */ };
  const exportExcel = (data) => { /* ... */ };

  // Business info for receipt
  const businessInfo = {
      name: "Baber Market Landhi no 3 1/2",
      address: "Super Market, Karachi",
      phone: "0321-3630916, 0300-2559902",
      owner: "Saleem Ullah",
      whatsapp: "0333-7304781"
  };

  const handlePrintReceipt = useReactToPrint({ content: () => receiptRef.current });

  const handleDownloadImage = () => {
    if (!receiptRef.current) return;
    toast.loading('Generating Image...');
    html2canvas(receiptRef.current, { scale: 3, useCORS: true })
      .then((canvas) => {
        const link = document.createElement('a');
        link.download = `receipt-${selectedSale.id}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        toast.dismiss(); toast.success('Image downloaded!');
      }).catch(err => { toast.dismiss(); toast.error('Could not generate image.'); });
  };
  
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        {/* ... Search and Filter UI (No Changes) ... */}

        <div className="overflow-x-auto max-h-[70vh]">
            {/* ... Sales Table (No Changes in structure) ... */}
        </div>
      </div>
      
      {/* UPDATED RECEIPT MODAL */}
      <Modal isOpen={!!selectedSale} onRequestClose={() => setSelectedSale(null)} contentLabel="Sale Receipt Modal" className="bg-transparent" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {selectedSale && (
          <div className="bg-gray-100 p-4 rounded-lg shadow-xl relative">
            <ModernReceipt ref={receiptRef} sale={selectedSale} businessInfo={businessInfo} />
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={handlePrintReceipt} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"><FiPrinter /> Print</button>
              <button onClick={handleDownloadImage} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"><FiDownload /> Download</button>
              <button onClick={() => setSelectedSale(null)} className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"><FiX /> Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SalesReport;