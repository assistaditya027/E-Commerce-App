import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Routes, Route, Navigate } from 'react-router-dom';
import Add from './pages/Add';
import List from './pages/List';
import Orders from './pages/Orders';
import Edit from './pages/Edit';
import Login from './pages/Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const backendUrl = import.meta.env.VITE_BACKEND_URL;

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') ?? '');

  useEffect(() => {
    localStorage.setItem('token', token);
  }, [token]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer />
      {token === '' ? (
        <Login setToken={setToken} />
      ) : (
        <div className="flex flex-col min-h-screen">
          {/* Navbar — full width, sticky at top */}
          <Navbar setToken={setToken} />

          {/* Below navbar: sidebar + content */}
          <div className="flex flex-col sm:flex-row flex-1">
            {/* Sidebar:
                - Mobile: renders as a top bar with dropdown (w-full, no flex-shrink)
                - Desktop: renders as a left column (fixed width, full height) */}
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 py-6 sm:py-8 text-gray-600 text-base">
              <Routes>
                <Route path="/add" element={<Add token={token} setToken={setToken} />} />
                <Route path="/list" element={<List token={token} setToken={setToken} />} />
                <Route path="/orders" element={<Orders token={token} setToken={setToken} />} />
                <Route path="/edit" element={<Navigate to="/list" replace />} />
                <Route path="/edit/:id" element={<Edit token={token} setToken={setToken} />} />
              </Routes>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
