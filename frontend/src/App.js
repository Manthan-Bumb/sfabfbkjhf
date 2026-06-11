import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import BusinessAuth from "@/pages/BusinessAuth";
import CourierAuth from "@/pages/CourierAuth";
import AdminAuth from "@/pages/AdminAuth";
import BusinessDashboard from "@/pages/BusinessDashboard";
import CourierDashboard from "@/pages/CourierDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

const Protected = ({ role, children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-slate-500">Loading...</div>;
  if (!user) return <Navigate to={role === "admin" ? "/auth/admin" : role === "courier" ? "/auth/courier" : "/auth/business"} replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster richColors position="top-right" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/auth/business" element={<BusinessAuth />} />
            <Route path="/auth/courier" element={<CourierAuth />} />
            <Route path="/auth/admin" element={<AdminAuth />} />
            <Route path="/business/dashboard" element={<Protected role="business"><BusinessDashboard /></Protected>} />
            <Route path="/courier/dashboard" element={<Protected role="courier"><CourierDashboard /></Protected>} />
            <Route path="/admin/dashboard" element={<Protected role="admin"><AdminDashboard /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
