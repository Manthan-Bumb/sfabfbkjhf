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

export default function BusinessAuth() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const tab = params.get("tab") || "login";
  const { login } = useAuth();

  // Login
  const [li, setLi] = useState({ email: "", password: "" });
  const doLogin = async () => {
    try {
      const { data } = await api.post("/auth/login", li);
      if (data.user.role !== "business") return toast.error("This account is not a business account");
      login(data.token, data.user); toast.success("Welcome back!"); nav("/business/dashboard");
    } catch (e) { toast.error(e?.response?.data?.detail || "Login failed"); }
  };

  // Register
  const [reg, setReg] = useState({
    company_name: "", gst_number: "", contact_person: "", mobile: "", email: "", password: "", otp: ""
  });
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const setR = (k, v) => setReg(r => ({ ...r, [k]: v }));

  const sendOtp = async () => {
    try {
      const { data } = await api.post("/auth/send-otp", { mobile: reg.mobile });
      setOtpSent(true); setDevOtp(data.dev_otp);
      toast.success(`OTP sent (dev: ${data.dev_otp})`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to send OTP"); }
  };

  const doRegister = async () => {
    try {
      const { data } = await api.post("/auth/register-business", reg);
      login(data.token, data.user); toast.success("Account created — welcome!"); nav("/business/dashboard");
    } catch (e) { toast.error(e?.response?.data?.detail || "Registration failed"); }
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <section className="max-w-md mx-auto px-5 py-12">
        <div className="label-eyebrow">Business Portal</div>
        <h1 className="font-display font-bold text-4xl tracking-tight mt-2">Ship smarter.</h1>
        <p className="text-slate-600 text-sm mt-2 mb-6">Verified businesses only. GST mandatory.</p>

        <Tabs defaultValue={tab}>
          <TabsList data-testid="biz-auth-tabs" className="grid grid-cols-2 rounded-sm bg-slate-100">
            <TabsTrigger value="login" data-testid="biz-login-tab" className="rounded-sm">Login</TabsTrigger>
            <TabsTrigger value="register" data-testid="biz-register-tab" className="rounded-sm">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-6">
            <div><Label className="label-eyebrow">Email</Label><Input data-testid="biz-login-email" type="email" className="rounded-sm mt-1.5 border-slate-300" value={li.email} onChange={e => setLi({...li, email: e.target.value})} /></div>
            <div><Label className="label-eyebrow">Password</Label><Input data-testid="biz-login-password" type="password" className="rounded-sm mt-1.5 border-slate-300" value={li.password} onChange={e => setLi({...li, password: e.target.value})} /></div>
            <Button data-testid="biz-login-submit" onClick={doLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-sm h-11">Login</Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-3 mt-6">
            <div><Label className="label-eyebrow">Company Name</Label><Input data-testid="biz-reg-company" className="rounded-sm mt-1.5 border-slate-300" value={reg.company_name} onChange={e => setR("company_name", e.target.value)} /></div>
            <div><Label className="label-eyebrow">GST Number (15-char)</Label><Input data-testid="biz-reg-gst" className="rounded-sm mt-1.5 border-slate-300" placeholder="27ABCDE1234A1Z5" value={reg.gst_number} onChange={e => setR("gst_number", e.target.value.toUpperCase())} /></div>
            <div><Label className="label-eyebrow">Contact Person</Label><Input data-testid="biz-reg-contact" className="rounded-sm mt-1.5 border-slate-300" value={reg.contact_person} onChange={e => setR("contact_person", e.target.value)} /></div>
            <div><Label className="label-eyebrow">Email</Label><Input data-testid="biz-reg-email" type="email" className="rounded-sm mt-1.5 border-slate-300" value={reg.email} onChange={e => setR("email", e.target.value)} /></div>
            <div className="flex gap-2 items-end">
              <div className="flex-1"><Label className="label-eyebrow">Mobile</Label><Input data-testid="biz-reg-mobile" className="rounded-sm mt-1.5 border-slate-300" placeholder="9876543210" value={reg.mobile} onChange={e => setR("mobile", e.target.value)} /></div>
              <Button data-testid="biz-reg-send-otp" type="button" variant="outline" className="rounded-sm border-slate-300" onClick={sendOtp}>Send OTP</Button>
            </div>
            {otpSent && (
              <div><Label className="label-eyebrow">OTP {devOtp && <span className="text-blue-600 normal-case">(dev: {devOtp})</span>}</Label>
                <Input data-testid="biz-reg-otp" className="rounded-sm mt-1.5 border-slate-300" value={reg.otp} onChange={e => setR("otp", e.target.value)} />
              </div>
            )}
            <div><Label className="label-eyebrow">Password</Label><Input data-testid="biz-reg-password" type="password" className="rounded-sm mt-1.5 border-slate-300" value={reg.password} onChange={e => setR("password", e.target.value)} /></div>
            <Button data-testid="biz-reg-submit" onClick={doRegister} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-sm h-11 mt-2">Create Business Account</Button>
          </TabsContent>
        </Tabs>
      </section>
      <Footer />
    </div>
  );
}
