import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert } from "lucide-react";

export default function AdminAuth() {
  const nav = useNavigate(); const { login } = useAuth();
  const [li, setLi] = useState({ email: "", password: "" });
  const doLogin = async () => {
    try {
      const { data } = await api.post("/auth/login", li);
      if (data.user.role !== "admin") return toast.error("Not an admin account");
      login(data.token, data.user); toast.success("Admin signed in"); nav("/admin/dashboard");
    } catch (e) { toast.error(e?.response?.data?.detail || "Login failed"); }
  };
  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <section className="max-w-md mx-auto px-5 py-12">
        <div className="flex items-center gap-2 label-eyebrow"><ShieldAlert className="w-4 h-4" /> Admin Console</div>
        <h1 className="font-display font-bold text-4xl tracking-tight mt-2">Restricted access.</h1>
        <div className="mt-6 space-y-4">
          <div><Label className="label-eyebrow">Email</Label><Input data-testid="admin-email" type="email" placeholder="admin@logscanner.in" className="rounded-sm mt-1.5 border-slate-300" value={li.email} onChange={e => setLi({...li, email: e.target.value})} /></div>
          <div><Label className="label-eyebrow">Password</Label><Input data-testid="admin-password" type="password" placeholder="••••••••" className="rounded-sm mt-1.5 border-slate-300" value={li.password} onChange={e => setLi({...li, password: e.target.value})} /></div>
          <Button data-testid="admin-login-btn" onClick={doLogin} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-sm h-11">Sign in to Console</Button>
        </div>
      </section>
    </div>
  );
}
