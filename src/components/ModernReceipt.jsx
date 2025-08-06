// src/components/ModernReceipt.jsx
import React from 'react';

const ModernReceipt = React.forwardRef(({ sale, businessInfo }, ref) => {
  if (!sale) return null;

  // Calculations with discount
  const calculateSubtotal = (items) => items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculateTotalDiscount = (items) => items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
  
  const subtotal = calculateSubtotal(sale.items);
  const totalItemDiscount = calculateTotalDiscount(sale.items);
  const additionalDiscount = sale.additionalDiscount || 0;
  const finalSubtotal = subtotal - totalItemDiscount; // Subtotal after item discounts
  const finalGrandTotal = finalSubtotal - additionalDiscount;
  const change = sale.amountPaid - finalGrandTotal;

  return (
    <div ref={ref} className="bg-white text-gray-800 font-sans p-6 w-[320px] shadow-lg rounded-lg">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{businessInfo?.name || 'Aasan POS'}</h1>
        <p className="text-xs text-gray-500">{businessInfo?.address || 'Modern Sale Receipt'}</p>
        <p className="text-xs text-gray-500">{businessInfo?.phone || ''}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 text-xs mb-4 pb-2 border-b border-dashed">
        <div><strong>Inv #:</strong> {sale.id.toString().slice(-6).toUpperCase()}</div>
        <div className="text-right"><strong>Date:</strong> {new Date(sale.date).toLocaleDateString('en-GB')}</div>
        <div><strong>Customer:</strong></div>
        <div className="text-right">{sale.customerName || 'Walk-in Customer'}</div>
      </div>

      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b">
            <th className="text-left font-semibold py-2">ITEM</th>
            <th className="text-center font-semibold">QTY</th>
            <th className="text-right font-semibold">PRICE</th>
            <th className="text-right font-semibold">DISC/item</th>
            <th className="text-right font-semibold">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={item.barcode || index} className="border-b border-gray-100">
              <td className="py-2">{item.name}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">{item.price.toFixed(2)}</td>
              <td className="text-right text-red-500">{(item.discount || 0).toFixed(2)}</td>
              <td className="text-right font-medium">{((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span>PKR {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Item Discounts:</span>
          <span className="text-red-500">- PKR {totalItemDiscount.toFixed(2)}</span>
        </div>
        {/* --- NAYA: Show Additional Discount on Receipt --- */}
        {additionalDiscount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Additional Discount:</span>
            <span className="text-red-500">- PKR {additionalDiscount.toFixed(2)}</span>
          </div>
        )}
        {/* --- END NAYA --- */}
        <div className="flex justify-between text-base font-bold pt-2 border-t mt-2">
          {/* --- NAYA: Update Grand Total on Receipt --- */}
          <span>Grand Total:</span>
          <span>PKR {finalGrandTotal.toFixed(2)}</span>
          {/* --- END NAYA --- */}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Amount Paid:</span>
          <span>PKR {sale.amountPaid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-gray-600">Change:</span>
          <span>PKR {change > 0 ? change.toFixed(2) : '0.00'}</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t">
        <p>Thank you for shopping with us!</p>
        <p className="font-semibold mt-2">Powered by Saleem Ullah</p>
        <p>WhatsApp: 0333-7304781</p>
      </div>
    </div>
  );
});

export default ModernReceipt;
