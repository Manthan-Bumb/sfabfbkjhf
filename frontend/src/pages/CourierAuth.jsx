import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function CourierAuth() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const tab = params.get("tab") || "login";
  const { login } = useAuth();

  const [li, setLi] = useState({ email: "", password: "" });
  const doLogin = async () => {
    try {
      const { data } = await api.post("/auth/login", li);
      if (data.user.role !== "courier") return toast.error("Not a courier account");
      login(data.token, data.user); toast.success("Welcome back!"); nav("/courier/dashboard");
    } catch (e) { toast.error(e?.response?.data?.detail || "Login failed"); }
  };

  const [reg, setReg] = useState({
    company_name: "", gst_number: "", pan_number: "", contact_person: "",
    mobile: "", email: "", password: "", otp: "", years_experience: 1,
  });
  const setR = (k, v) => setReg(r => ({ ...r, [k]: v }));
  const [otpSent, setOtpSent] = useState(false); const [devOtp, setDevOtp] = useState("");

  const sendOtp = async () => {
    try { const { data } = await api.post("/auth/send-otp", { mobile: reg.mobile });
      setOtpSent(true); setDevOtp(data.dev_otp); toast.success(`OTP sent (dev: ${data.dev_otp})`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const doRegister = async () => {
    try {
      const { data } = await api.post("/auth/register-courier", { ...reg, years_experience: Number(reg.years_experience) });
      login(data.token, data.user); toast.success("Account created · pending admin approval"); nav("/courier/dashboard");
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <section className="max-w-md mx-auto px-5 py-12">
        <div className="label-eyebrow">Courier Partner Portal</div>
        <h1 className="font-display font-bold text-4xl tracking-tight mt-2">Earn more leads.</h1>
        <p className="text-slate-600 text-sm mt-2 mb-6">Inactive until admin approval.</p>

        <Tabs defaultValue={tab}>
          <TabsList data-testid="cp-auth-tabs" className="grid grid-cols-2 rounded-sm bg-slate-100">
            <TabsTrigger value="login" data-testid="cp-login-tab" className="rounded-sm">Login</TabsTrigger>
            <TabsTrigger value="register" data-testid="cp-register-tab" className="rounded-sm">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-6">
            <div><Label className="label-eyebrow">Email</Label><Input data-testid="cp-login-email" type="email" className="rounded-sm mt-1.5 border-slate-300" value={li.email} onChange={e => setLi({...li, email: e.target.value})} /></div>
            <div><Label className="label-eyebrow">Password</Label><Input data-testid="cp-login-password" type="password" className="rounded-sm mt-1.5 border-slate-300" value={li.password} onChange={e => setLi({...li, password: e.target.value})} /></div>
            <Button data-testid="cp-login-submit" onClick={doLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-sm h-11">Login</Button>
            <div className="text-xs text-slate-500 pt-2 text-center">Demo partner: <code>bluedartexpress@partner.in</code> / <code>partner@123</code></div>
          </TabsContent>

          <TabsContent value="register" className="space-y-3 mt-6">
            <div><Label className="label-eyebrow">Company Name</Label><Input data-testid="cp-reg-company" className="rounded-sm mt-1.5 border-slate-300" value={reg.company_name} onChange={e => setR("company_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="label-eyebrow">GST</Label><Input data-testid="cp-reg-gst" className="rounded-sm mt-1.5 border-slate-300" placeholder="27ABCDE1234A1Z5" value={reg.gst_number} onChange={e => setR("gst_number", e.target.value.toUpperCase())} /></div>
              <div><Label className="label-eyebrow">PAN</Label><Input data-testid="cp-reg-pan" className="rounded-sm mt-1.5 border-slate-300" placeholder="ABCDE1234A" value={reg.pan_number} onChange={e => setR("pan_number", e.target.value.toUpperCase())} /></div>
            </div>
            <div><Label className="label-eyebrow">Contact Person</Label><Input data-testid="cp-reg-contact" className="rounded-sm mt-1.5 border-slate-300" value={reg.contact_person} onChange={e => setR("contact_person", e.target.value)} /></div>
            <div><Label className="label-eyebrow">Email</Label><Input data-testid="cp-reg-email" type="email" className="rounded-sm mt-1.5 border-slate-300" value={reg.email} onChange={e => setR("email", e.target.value)} /></div>
            <div className="flex gap-2 items-end">
              <div className="flex-1"><Label className="label-eyebrow">Mobile</Label><Input data-testid="cp-reg-mobile" className="rounded-sm mt-1.5 border-slate-300" value={reg.mobile} onChange={e => setR("mobile", e.target.value)} /></div>
              <Button data-testid="cp-reg-send-otp" type="button" variant="outline" className="rounded-sm border-slate-300" onClick={sendOtp}>Send OTP</Button>
            </div>
            {otpSent && <div><Label className="label-eyebrow">OTP {devOtp && <span className="text-blue-600 normal-case">(dev: {devOtp})</span>}</Label><Input data-testid="cp-reg-otp" className="rounded-sm mt-1.5 border-slate-300" value={reg.otp} onChange={e => setR("otp", e.target.value)} /></div>}
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="label-eyebrow">Years Exp.</Label><Input data-testid="cp-reg-years" type="number" className="rounded-sm mt-1.5 border-slate-300" value={reg.years_experience} onChange={e => setR("years_experience", e.target.value)} /></div>
              <div><Label className="label-eyebrow">Password</Label><Input data-testid="cp-reg-password" type="password" className="rounded-sm mt-1.5 border-slate-300" value={reg.password} onChange={e => setR("password", e.target.value)} /></div>
            </div>
            <Button data-testid="cp-reg-submit" onClick={doRegister} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-sm h-11 mt-2">Create Partner Account</Button>
          </TabsContent>
        </Tabs>
      </section>
      <Footer />
    </div>
  );
}
