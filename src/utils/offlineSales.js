import { collection, addDoc } from "firebase/firestore"; // ✅ REQUIRED!
import { db } from "../firebase"; // ✅ Make sure db is exported from firebase.js

// LocalStorage me sale save karna
export function saveSaleLocally(sale) {
  const existing = JSON.parse(localStorage.getItem("offlineSales") || "[]");
  existing.push(sale);
  localStorage.setItem("offlineSales", JSON.stringify(existing));
}

// Online hone par Firestore me sync karna
export async function syncOfflineSales() {
  const offlineSales = JSON.parse(localStorage.getItem("offlineSales") || "[]");

  if (!offlineSales.length) return;

  for (const sale of offlineSales) {
    try {
      await addDoc(collection(db, "sales"), sale);
    } catch (error) {
      console.error("❌ Sale sync failed:", error);
      return; // agar ek bhi fail ho jaye to process roko
    }
  }

  // Agar sab sync ho gaye to LocalStorage clear kar do
  localStorage.removeItem("offlineSales");
}
