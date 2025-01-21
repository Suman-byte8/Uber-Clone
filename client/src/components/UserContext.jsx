import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context for user and captain IDs
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(() => {
    // Retrieve userId from local storage on initialization
    return localStorage.getItem('userId') || null;
  });
  const [captainId, setCaptainId] = useState(null);

  useEffect(() => {
    // Store userId in local storage whenever it changes
    if (userId) {
      localStorage.setItem('userId', userId);
    } else {
      localStorage.removeItem('userId'); // Clear if userId is null
    }
  }, [userId]);

  useEffect(() => {
    // Fetch user data or set userId here
    console.log("Current User ID:", userId);
  }, [userId]);

  console.log("UserProvider rendered with userId:", userId); // Debugging line

  const logout = () => {
    setUserId(null); // Clear userId in context
  };

  return (
    <UserContext.Provider value={{ userId, setUserId, captainId, setCaptainId, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUserContext = () => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
