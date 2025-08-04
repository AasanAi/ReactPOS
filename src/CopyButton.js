// src/CopyButton.js

import React from "react";
import { copyProducts } from "./copyProducts";

export default function CopyButton() {
  const handleCopy = () => {
    const fromUserId = "yz27Q3HuDeQgCpZQct0sIHBDCpv1"; // 🔁 Jiska product copy karna hai
    const toUserId = "NEW_USER_ID_YAHAN";              // ✅ Jisko dena hai — yahan new user ka UID likho

    copyProducts(fromUserId, toUserId);
  };

  return (
    <button onClick={handleCopy}>
      📤 Copy Products to New User
    </button>
  );
}
