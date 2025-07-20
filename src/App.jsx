// YEH SIRF EK TEMPORARY TEST CODE HAI

import React from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login'; // Login component ko import karein

function App() {
  const { currentUser, loading, logout } = useAuth();

  // Sabse pehle, check karein ki context kaam kar raha hai ya nahi
  if (loading) {
    return <h1>Loading Authentication...</h1>;
  }

  // Ab user ki state check karein
  if (currentUser) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Test Successful!</h1>
        <h2>User is Logged In.</h2>
        <p>Email: {currentUser.email}</p>
        <button 
          onClick={logout} 
          style={{ padding: '10px 20px', background: 'red', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
    );
  } else {
    // Agar user login nahi hai, to Login component dikhayein
    return <Login />;
  }
}

export default App;