import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Truck, FileText, AlertTriangle, TrendingUp, BarChart3, Bell, Activity, Map, LayoutGrid, ShieldCheck, Trophy } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie, Legend } from "recharts";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "couriers", label: "Courier Approvals", icon: ShieldCheck },
  { id: "businesses", label: "Businesses", icon: Users },
  { id: "leads", label: "All Leads", icon: FileText },
  { id: "sla", label: "SLA Monitor", icon: Activity },
  { id: "rates", label: "Rate Cards", icon: BarChart3 },
  { id: "notifications", label: "Notification Logs", icon: Bell },
];

const COLORS = ["#2563eb", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#64748b"];

export default function AdminDashboard() {
  const [section, setSection] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [leads, setLeads] = useState([]);
  const [sla, setSla] = useState([]);
  const [rateCards, setRateCards] = useState([]);
  const [notifLogs, setNotifLogs] = useState([]);
  const [filter, setFilter] = useState("");

  const reload = async () => {
    try {
      const [ov, c, b, l, s, r, n] = await Promise.all([
        api.get("/admin/overview"),
        api.get("/admin/couriers"),
        api.get("/admin/businesses"),
        api.get("/admin/leads"),
        api.get("/admin/sla-monitor"),
        api.get("/admin/rate-cards"),
        api.get("/admin/notification-logs"),
      ]);
      setOverview(ov.data); setCouriers(c.data); setBusinesses(b.data);
      setLeads(l.data); setSla(s.data); setRateCards(r.data); setNotifLogs(n.data);
    } catch (e) { /* noop */ }
  };
  useEffect(() => { reload(); }, []);

  const approve = async (id) => { await api.post(`/admin/couriers/${id}/approve`); toast.success("Approved"); reload(); };
  const reject = async (id) => { await api.post(`/admin/couriers/${id}/reject`); toast.success("Rejected"); reload(); };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />
      <div className="max-w-[1500px] mx-auto px-5 md:px-8 py-8 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-sm p-2 sticky top-20">
            <div className="px-3 py-2 mb-1 label-eyebrow">Admin Console</div>
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button key={s.id} data-testid={`adm-nav-${s.id}`}
                  onClick={() => setSection(s.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm transition-colors ${section === s.id ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-700"}`}>
                  <Icon className="w-4 h-4" /> {s.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10 space-y-6">
          <div>
            <div className="label-eyebrow">Marketplace Owner View</div>
            <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight mt-1">{SECTIONS.find(s => s.id === section)?.label}</h1>
          </div>

          {section === "overview" && <Overview data={overview} />}
          {section === "couriers" && <CouriersTable couriers={couriers} approve={approve} reject={reject} />}
          {section === "businesses" && <BusinessesTable businesses={businesses} />}
          {section === "leads" && <LeadsTable leads={leads} filter={filter} setFilter={setFilter} />}
          {section === "sla" && <SLATable sla={sla} />}
          {section === "rates" && <RateCardsTable cards={rateCards} />}
          {section === "notifications" && <NotificationLogsTable logs={notifLogs} />}
        </main>
      </div>
    </div>
  );
}

const Overview = ({ data }) => {
  if (!data) return <div className="text-slate-500">Loading overview...</div>;
  const k = data.kpi;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Kpi label="Businesses" v={k.businesses} icon={<Users className="w-4 h-4" />} />
        <Kpi label="Active Couriers" v={k.couriers_active} icon={<Truck className="w-4 h-4" />} />
        <Kpi label="Pending" v={k.couriers_pending} icon={<AlertTriangle className="w-4 h-4" />} tone="amber" />
        <Kpi label="Total Leads" v={k.leads_total} icon={<FileText className="w-4 h-4" />} />
        <Kpi label="Open Leads" v={k.leads_open} icon={<Activity className="w-4 h-4" />} tone="blue" />
        <Kpi label="Won" v={k.leads_won} icon={<Trophy className="w-4 h-4" />} tone="emerald" />
        <Kpi label="Rate Cards" v={k.rate_cards} icon={<BarChart3 className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Leads · last 14 days" subtitle="New leads volume" col="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.leads_by_day} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2, border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="leads" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leads by status" subtitle="Pipeline distribution">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.lead_by_status.filter(x => x.value > 0)} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                {data.lead_by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Top Couriers by Leads" subtitle="Lead volume per partner">
          {data.top_couriers.length === 0
            ? <div className="text-sm text-slate-500 py-8 text-center">No lead data yet</div>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.top_couriers} layout="vertical" margin={{ top: 4, right: 12, left: 60, bottom: 0 }}>
                  <CartesianGrid stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#0f172a" }} width={120} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="leads" fill="#2563eb" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>}
        </ChartCard>

        <ChartCard title="Top Routes" subtitle="Most-requested freight lanes">
          {data.top_routes.length === 0
            ? <div className="text-sm text-slate-500 py-8 text-center">No route data yet</div>
            : <div className="space-y-2">
                {data.top_routes.map((r, i) => (
                  <div key={r.route} className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2.5"><span className="w-5 h-5 bg-slate-100 text-slate-700 rounded-sm text-xs font-bold flex items-center justify-center">{i+1}</span><Map className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm font-medium">{r.route}</span></div>
                    <span className="text-sm font-display font-bold">{r.leads}</span>
                  </div>
                ))}
              </div>}
        </ChartCard>
      </div>

      <ChartCard title="Marketplace Inventory · Rate Cards by Mode">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.transport_modes} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" />
            <XAxis dataKey="mode" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="count" fill="#0f172a" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

const Kpi = ({ label, v, icon, tone }) => {
  const tones = { blue: "text-blue-600", amber: "text-amber-600", emerald: "text-emerald-600" };
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-sm">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow text-[10px]">{label}</div>
        <div className={tones[tone] || "text-slate-400"}>{icon}</div>
      </div>
      <div className="font-display font-bold text-2xl mt-2">{v}</div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, col = "" }) => (
  <div className={`bg-white border border-slate-200 rounded-sm p-5 ${col}`}>
    <div className="flex items-end justify-between mb-4">
      <div>
        <div className="font-display font-semibold text-base">{title}</div>
        {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
      </div>
    </div>
    {children}
  </div>
);

const CouriersTable = ({ couriers, approve, reject }) => (
  <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
        <tr><th className="p-3">Company</th><th className="p-3">GST</th><th className="p-3">PAN</th><th className="p-3">Contact</th><th className="p-3">Exp</th><th className="p-3">Status</th><th className="p-3"></th></tr>
      </thead>
      <tbody>
        {couriers.map(c => (
          <tr key={c.id} className="border-t border-slate-200" data-testid={`adm-courier-${c.id}`}>
            <td className="p-3 font-medium">{c.company_name}</td>
            <td className="p-3 font-mono text-xs">{c.gst_number}</td>
            <td className="p-3 font-mono text-xs">{c.pan_number || "—"}</td>
            <td className="p-3 text-xs"><div>{c.email}</div><div className="text-slate-500">{c.mobile}</div></td>
            <td className="p-3">{c.years_experience}y</td>
            <td className="p-3">
              {c.admin_approved ? <Badge className="bg-emerald-600 text-white rounded-sm text-[10px]">APPROVED</Badge>
                : c.status === "rejected" ? <Badge className="bg-red-600 text-white rounded-sm text-[10px]">REJECTED</Badge>
                : <Badge className="bg-amber-500 text-white rounded-sm text-[10px]">PENDING</Badge>}
            </td>
            <td className="p-3 text-right space-x-2 whitespace-nowrap">
              {!c.admin_approved && c.status !== "rejected" && <>
                <Button data-testid={`adm-approve-${c.id}`} size="sm" onClick={() => approve(c.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm">Approve</Button>
                <Button data-testid={`adm-reject-${c.id}`} size="sm" variant="outline" onClick={() => reject(c.id)} className="rounded-sm border-slate-300">Reject</Button>
              </>}
            </td>
          </tr>
        ))}
        {couriers.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500">No couriers.</td></tr>}
      </tbody>
    </table>
  </div>
);

const BusinessesTable = ({ businesses }) => (
  <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">Company</th><th className="p-3">GST</th><th className="p-3">Contact</th><th className="p-3">Mobile</th><th className="p-3">Status</th><th className="p-3">Joined</th></tr></thead>
      <tbody>
        {businesses.map(b => (
          <tr key={b.id} className="border-t border-slate-200" data-testid={`adm-biz-${b.id}`}>
            <td className="p-3 font-medium">{b.company_name}</td>
            <td className="p-3 font-mono text-xs">{b.gst_number}</td>
            <td className="p-3 text-xs"><div>{b.contact_person}</div><div className="text-slate-500">{b.email}</div></td>
            <td className="p-3">{b.mobile}</td>
            <td className="p-3"><Badge className="bg-emerald-600 text-white rounded-sm text-[10px]">{b.status?.toUpperCase()}</Badge></td>
            <td className="p-3 text-xs text-slate-500">{b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}</td>
          </tr>
        ))}
        {businesses.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">No registered businesses yet.</td></tr>}
      </tbody>
    </table>
  </div>
);

const LeadsTable = ({ leads, filter, setFilter }) => {
  const visible = leads.filter(l => !filter || l.status === filter || l.business_name?.toLowerCase().includes(filter.toLowerCase()) || l.courier_name?.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input data-testid="adm-leads-filter" placeholder="Filter by status / business / courier..." className="rounded-sm border-slate-300 max-w-md" value={filter} onChange={e => setFilter(e.target.value)} />
        <div className="text-xs text-slate-500">{visible.length} of {leads.length}</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">Lead</th><th className="p-3">Business → Courier</th><th className="p-3">Route</th><th className="p-3">Parcel</th><th className="p-3">Special</th><th className="p-3">Status</th><th className="p-3">Created</th></tr></thead>
          <tbody>
            {visible.map(l => (
              <tr key={l.id} className="border-t border-slate-200">
                <td className="p-3 font-mono text-xs">{l.id}</td>
                <td className="p-3 text-xs">{l.business_name} → <span className="font-medium">{l.courier_name}</span></td>
                <td className="p-3">{l.pickup_city} → {l.delivery_city}</td>
                <td className="p-3 text-xs">
                  <div>{l.weight}kg · {l.parcel_type}</div>
                  {l.parcel_value > 0 && <div className="text-slate-500">₹{Number(l.parcel_value).toLocaleString("en-IN")}</div>}
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    {l.insurance_required && <Badge className="bg-blue-600 text-white rounded-sm text-[9px] w-fit">INSURED</Badge>}
                    {l.temperature_controlled && <Badge className="bg-cyan-600 text-white rounded-sm text-[9px] w-fit">❄ TEMP</Badge>}
                    {!l.insurance_required && !l.temperature_controlled && <span className="text-xs text-slate-400">—</span>}
                  </div>
                </td>
                <td className="p-3"><Badge variant="outline" className="rounded-sm border-slate-300 text-[10px] uppercase">{l.status}</Badge></td>
                <td className="p-3 text-xs text-slate-500">{l.created_at ? new Date(l.created_at).toLocaleString() : "—"}</td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500">No leads match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SLATable = ({ sla }) => (
  <div className="space-y-3">
    <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm text-sm text-amber-900 flex items-center gap-2">
      <AlertTriangle className="w-4 h-4" /> Leads sorted by SLA deadline. Red = breached, amber = under 15 min.
    </div>
    <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">Lead</th><th className="p-3">Courier</th><th className="p-3">Route</th><th className="p-3">SLA Status</th></tr></thead>
        <tbody>
          {sla.map(l => {
            const breached = l.breached;
            const warning = !breached && l.mins_left !== null && l.mins_left < 15;
            return (
              <tr key={l.id} className="border-t border-slate-200">
                <td className="p-3 font-mono text-xs">{l.id}</td>
                <td className="p-3 font-medium">{l.courier_name}</td>
                <td className="p-3">{l.pickup_city} → {l.delivery_city}</td>
                <td className="p-3">
                  <Badge className={`rounded-sm text-[10px] text-white ${breached ? "bg-red-600" : warning ? "bg-amber-500" : "bg-emerald-600"}`}>
                    {breached ? `BREACHED (${Math.abs(l.mins_left)}m late)` : `${l.mins_left}m left`}
                  </Badge>
                </td>
              </tr>
            );
          })}
          {sla.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-slate-500">No active leads under SLA tracking.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

const RateCardsTable = ({ cards }) => (
  <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">Partner</th><th className="p-3">Route</th><th className="p-3">Mode</th><th className="p-3">Slab</th><th className="p-3">Base ₹</th><th className="p-3">Timeline</th></tr></thead>
      <tbody>
        {cards.slice(0, 100).map(r => (
          <tr key={r.id} className="border-t border-slate-200">
            <td className="p-3 font-medium">{r.courier_name}</td>
            <td className="p-3">{r.pickup_city} → {r.delivery_city}</td>
            <td className="p-3 text-xs">{r.transport_mode}</td>
            <td className="p-3 text-xs">{r.weight_slab}</td>
            <td className="p-3 font-display font-bold">₹{r.base_rate}</td>
            <td className="p-3 text-xs text-slate-500">{r.delivery_timeline}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {cards.length > 100 && <div className="text-xs text-slate-500 px-3 py-2 border-t">Showing first 100 of {cards.length} rate cards.</div>}
  </div>
);

const NotificationLogsTable = ({ logs }) => (
  <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">Channel</th><th className="p-3">To</th><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3">When</th></tr></thead>
      <tbody>
        {logs.map(l => (
          <tr key={l.id} className="border-t border-slate-200">
            <td className="p-3"><Badge variant="outline" className="rounded-sm text-[10px] uppercase border-slate-300">{l.channel}</Badge></td>
            <td className="p-3 text-xs font-mono">{l.to || "—"}</td>
            <td className="p-3 text-xs">{l.title}</td>
            <td className="p-3"><Badge className={`rounded-sm text-[10px] text-white ${l.status === "delivered" ? "bg-emerald-600" : "bg-slate-500"}`}>{l.status?.toUpperCase()}</Badge></td>
            <td className="p-3 text-xs text-slate-500">{l.created_at ? new Date(l.created_at).toLocaleString() : "—"}</td>
          </tr>
        ))}
        {logs.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">No notifications dispatched yet.</td></tr>}
      </tbody>
    </table>
  </div>
);
