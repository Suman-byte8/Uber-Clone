import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import App from "./App.jsx";
import "./index.css";
import { UserProvider } from "./context/UserContext.jsx"; // Corrected path
import { ToastProvider } from "./context/ToastContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {" "}
      {/* Wrap everything inside BrowserRouter */}
      <UserProvider>
        <ToastProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </ToastProvider>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);
