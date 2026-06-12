import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import NotificationsBell from "@/components/NotificationsBell";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_cargo-hub-134/artifacts/pnh7dk3f_Untitled%20design.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const dashLink = () => {
    if (!user) return null;
    if (user.role === "business") return "/business/dashboard";
    if (user.role === "courier") return "/courier/dashboard";
    if (user.role === "admin") return "/admin/dashboard";
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-18 flex items-center justify-between py-2.5">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5">
          <img src={LOGO_URL} alt="LogScanner" className="h-9 w-9 object-cover rounded-sm" />
          <div className="font-display font-bold text-lg tracking-tight">
            <span className="text-slate-900">Log</span><span className="text-blue-600">Scanner</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600">
          <Link to="/" data-testid="nav-home" className="hover:text-slate-900">Home</Link>
          <Link to="/search" data-testid="nav-search" className="hover:text-slate-900">Find Couriers</Link>
          <Link to="/auth/courier" data-testid="nav-partner" className="hover:text-slate-900">Become a Partner</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationsBell />
              <Link to={dashLink()}>
                <Button data-testid="nav-dashboard-btn" variant="outline" className="border-slate-300">Dashboard</Button>
              </Link>
              <Button data-testid="nav-logout-btn" variant="ghost" size="icon" onClick={() => { logout(); nav("/"); }}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth/business">
                <Button data-testid="nav-login-btn" variant="ghost" className="text-slate-700">Login</Button>
              </Link>
              <Link to="/auth/business?tab=register">
                <Button data-testid="nav-signup-btn" className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
