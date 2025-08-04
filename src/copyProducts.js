// src/copyProducts.js

import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase"; // agar firebase.js kisi aur folder mein ho to path adjust karo

export async function copyProducts(fromUserId, toUserId) {
  try {
    const sourceProductsRef = collection(db, "users", fromUserId, "products");
    const snapshot = await getDocs(sourceProductsRef);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const targetDocRef = doc(db, "users", toUserId, "products", docSnap.id);
      await setDoc(targetDocRef, data);
    }

    console.log("✅ Products copied successfully.");
  } catch (error) {
    console.error("❌ Error copying products: ", error);
  }
}
