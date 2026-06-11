import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Truck, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [couriers, setCouriers] = useState([]);
  const [leads, setLeads] = useState([]);

  const load = async () => {
    const [s, c, l] = await Promise.all([api.get("/admin/stats"), api.get("/admin/couriers"), api.get("/admin/leads")]);
    setStats(s.data); setCouriers(c.data); setLeads(l.data);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const approve = async (id) => { await api.post(`/admin/couriers/${id}/approve`); toast.success("Approved"); load(); };
  const reject = async (id) => { await api.post(`/admin/couriers/${id}/reject`); toast.success("Rejected"); load(); };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-10">
        <div className="mb-8">
          <div className="label-eyebrow">Admin Console</div>
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight mt-1">Marketplace Operations</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Stat label="Businesses" v={stats.total_businesses || 0} icon={<Users className="w-5 h-5" />} />
          <Stat label="Couriers" v={stats.total_couriers || 0} icon={<Truck className="w-5 h-5" />} />
          <Stat label="Pending" v={stats.pending_couriers || 0} icon={<AlertTriangle className="w-5 h-5" />} />
          <Stat label="Leads" v={stats.total_leads || 0} icon={<FileText className="w-5 h-5" />} />
          <Stat label="Expired" v={stats.expired_leads || 0} icon={<AlertTriangle className="w-5 h-5" />} />
        </div>

        <Tabs defaultValue="couriers">
          <TabsList className="rounded-sm bg-slate-100">
            <TabsTrigger data-testid="adm-tab-couriers" value="couriers" className="rounded-sm">Courier Approvals</TabsTrigger>
            <TabsTrigger data-testid="adm-tab-leads" value="leads" className="rounded-sm">Lead Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="couriers" className="mt-6">
            <div className="border border-slate-200 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">Company</th><th className="p-3">GST</th><th className="p-3">Contact</th><th className="p-3">Exp</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
                <tbody>
                  {couriers.map(c => (
                    <tr key={c.id} className="border-t border-slate-200" data-testid={`adm-courier-${c.id}`}>
                      <td className="p-3 font-medium">{c.company_name}</td>
                      <td className="p-3 font-mono text-xs">{c.gst_number}</td>
                      <td className="p-3 text-xs"><div>{c.email}</div><div className="text-slate-500">{c.mobile}</div></td>
                      <td className="p-3">{c.years_experience}y</td>
                      <td className="p-3">
                        {c.admin_approved
                          ? <Badge className="bg-emerald-600 text-white rounded-sm text-[10px]">APPROVED</Badge>
                          : c.status === "rejected"
                          ? <Badge className="bg-red-600 text-white rounded-sm text-[10px]">REJECTED</Badge>
                          : <Badge className="bg-amber-500 text-white rounded-sm text-[10px]">PENDING</Badge>}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {!c.admin_approved && c.status !== "rejected" && <>
                          <Button data-testid={`adm-approve-${c.id}`} size="sm" onClick={() => approve(c.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm">Approve</Button>
                          <Button data-testid={`adm-reject-${c.id}`} size="sm" variant="outline" onClick={() => reject(c.id)} className="rounded-sm border-slate-300">Reject</Button>
                        </>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="leads" className="mt-6">
            <div className="border border-slate-200 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">Lead</th><th className="p-3">Business → Courier</th><th className="p-3">Route</th><th className="p-3">Weight</th><th className="p-3">Status</th></tr></thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} className="border-t border-slate-200">
                      <td className="p-3 font-mono text-xs">{l.id}</td>
                      <td className="p-3 text-xs">{l.business_name} → <span className="font-medium">{l.courier_name}</span></td>
                      <td className="p-3">{l.pickup_city} → {l.delivery_city}</td>
                      <td className="p-3">{l.weight}kg</td>
                      <td className="p-3"><Badge variant="outline" className="rounded-sm border-slate-300 text-[10px] uppercase">{l.status}</Badge></td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">No leads yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

const Stat = ({ label, v, icon }) => (
  <div className="border border-slate-200 p-5 rounded-sm">
    <div className="flex items-center justify-between"><div className="label-eyebrow">{label}</div><div className="text-blue-600">{icon}</div></div>
    <div className="font-display font-bold text-3xl mt-2">{v}</div>
  </div>
);
