import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Truck, ShieldCheck, FileText, Package } from "lucide-react";

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  useEffect(() => { api.get("/business/leads").then(r => setLeads(r.data)).catch(() => {}); }, []);

  const stats = {
    total: leads.length,
    pending: leads.filter(l => ["new", "callback_pending", "contacted"].includes(l.status)).length,
    won: leads.filter(l => l.status === "won").length,
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="label-eyebrow">Business Dashboard</div>
            <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight mt-1">{user?.company_name}</h1>
          </div>
          <Badge className="bg-emerald-600 text-white rounded-sm">VERIFIED</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Total Requests" value={stats.total} icon={<FileText className="w-5 h-5" />} />
          <Stat label="Active" value={stats.pending} icon={<Truck className="w-5 h-5" />} />
          <Stat label="Won Quotes" value={stats.won} icon={<Package className="w-5 h-5" />} />
          <Stat label="Verification" value="GST OK" icon={<ShieldCheck className="w-5 h-5" />} />
        </div>

        <Tabs defaultValue="leads">
          <TabsList className="rounded-sm bg-slate-100">
            <TabsTrigger data-testid="biz-tab-leads" value="leads" className="rounded-sm">My Requests</TabsTrigger>
            <TabsTrigger data-testid="biz-tab-profile" value="profile" className="rounded-sm">Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="leads" className="mt-6">
            <div className="border border-slate-200 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr><th className="p-3">ID</th><th className="p-3">Type</th><th className="p-3">Courier</th><th className="p-3">Route</th><th className="p-3">Parcel</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} className="border-t border-slate-200" data-testid={`biz-lead-${l.id}`}>
                      <td className="p-3 font-mono text-xs">{l.id}</td>
                      <td className="p-3">
                        {l.is_booking
                          ? <Badge className="bg-emerald-600 text-white rounded-sm text-[10px]">BOOKING</Badge>
                          : l.action === "quote"
                          ? <Badge variant="outline" className="rounded-sm border-slate-300 text-[10px]">QUOTE</Badge>
                          : <Badge variant="outline" className="rounded-sm border-slate-300 text-[10px]">CALLBACK</Badge>}
                      </td>
                      <td className="p-3 font-medium">{l.courier_name}</td>
                      <td className="p-3 text-slate-600">{l.pickup_city} → {l.delivery_city}<div className="text-xs text-slate-400">{l.weight}kg · {l.transport_mode}</div></td>
                      <td className="p-3 text-xs">
                        {l.parcel_value > 0 && <div className="font-semibold">₹{Number(l.parcel_value).toLocaleString("en-IN")}</div>}
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {l.insurance_required && <Badge className="bg-blue-600 text-white rounded-sm text-[9px]">INSURED</Badge>}
                          {l.temperature_controlled && <Badge className="bg-cyan-600 text-white rounded-sm text-[9px]">❄ TEMP</Badge>}
                        </div>
                      </td>
                      <td className="p-3">
                        {l.is_booking
                          ? <Badge className={`rounded-sm text-[10px] uppercase text-white ${l.booking_status === "approved" ? "bg-emerald-600" : l.booking_status === "rejected" ? "bg-red-600" : "bg-amber-500"}`}>{l.booking_status?.replace("_", " ")}</Badge>
                          : <Badge variant="outline" className="rounded-sm border-slate-300 text-[10px] uppercase">{l.status}</Badge>}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">No requests yet. Search for couriers to get started.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <div className="border border-slate-200 p-6 rounded-sm grid md:grid-cols-2 gap-5 text-sm">
              <Field k="Company" v={user?.company_name} />
              <Field k="GST" v={user?.gst_number} />
              <Field k="Contact" v={user?.contact_person} />
              <Field k="Email" v={user?.email} />
              <Field k="Mobile" v={user?.mobile} />
              <Field k="Status" v={user?.status} />
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

const Stat = ({ label, value, icon }) => (
  <div className="border border-slate-200 p-5 rounded-sm">
    <div className="flex items-center justify-between"><div className="label-eyebrow">{label}</div><div className="text-blue-600">{icon}</div></div>
    <div className="font-display font-bold text-3xl mt-2">{value}</div>
  </div>
);
const Field = ({ k, v }) => (
  <div><div className="label-eyebrow">{k}</div><div className="mt-1 font-medium">{v || "—"}</div></div>
);
