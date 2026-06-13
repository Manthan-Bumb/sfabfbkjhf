import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inbox, FileText, MapPin, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TRANSPORT_MODES = ["Air Cargo", "Rail Cargo", "Road Transport"];
const SLABS = ["1-100 KG", "101-500 KG", "501-1000 KG", "1001-5000 KG", "5001+ KG"];

export default function CourierDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [leads, setLeads] = useState([]);
  const [rateCards, setRateCards] = useState([]);
  const [coverage, setCoverage] = useState({ states: [], cities: [], pincodes: [] });
  const [rcForm, setRcForm] = useState({ pickup_city: "", delivery_city: "", transport_mode: "Road Transport", weight_slab: "1-100 KG", delivery_timeline: "3-5 days", pricing_type: "per_kg", base_rate: 30, min_charge: 500, fuel_pct: 8, handling: 50, insurance_pct: 0.5, pickup_charge: 100, delivery_charge: 100 });
  const [covInput, setCovInput] = useState({ city: "", state: "", pincode: "" });
  const [quickCity, setQuickCity] = useState("");

  const load = async () => {
    const [s, l, r, c] = await Promise.all([
      api.get("/courier/dashboard"), api.get("/courier/leads"),
      api.get("/courier/rate-cards"), api.get("/courier/coverage"),
    ]);
    setStats(s.data); setLeads(l.data); setRateCards(r.data); setCoverage(c.data);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const addRc = async () => {
    if (!rcForm.pickup_city) { toast.error("Select a pickup city"); return; }
    try {
      if (rcForm.apply_all) {
        const otherCities = (coverage.cities || []).filter(c => c !== rcForm.pickup_city);
        if (otherCities.length === 0) { toast.error("No other cities in your coverage"); return; }
        const payload = { ...rcForm, delivery_cities: otherCities, base_rate: Number(rcForm.base_rate) };
        delete payload.apply_all; delete payload.delivery_city;
        const { data } = await api.post("/courier/rate-cards/bulk", payload);
        toast.success(`${data.count} rate cards created`);
      } else {
        if (!rcForm.delivery_city) { toast.error("Select a delivery city"); return; }
        const payload = { ...rcForm, base_rate: Number(rcForm.base_rate) };
        delete payload.apply_all;
        await api.post("/courier/rate-cards", payload);
        toast.success("Rate card added");
      }
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };
  const delRc = async (id) => { await api.delete(`/courier/rate-cards/${id}`); load(); };

  const saveCov = async (next) => {
    const data = { ...coverage, ...next };
    await api.put("/courier/coverage", data);
    setCoverage(data); toast.success("Coverage updated");
  };

  const quickAddCity = async () => {
    const v = quickCity.trim();
    if (!v) return;
    if ((coverage.cities || []).map(c => c.toLowerCase()).includes(v.toLowerCase())) {
      toast.error("City already in your coverage"); return;
    }
    const next = { ...coverage, cities: [...(coverage.cities || []), v] };
    await api.put("/courier/coverage", next);
    setCoverage(next);
    setRcForm(f => ({ ...f, pickup_city: f.pickup_city || v }));
    setQuickCity("");
    toast.success(`Added ${v} to your coverage`);
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/leads/${id}/status`, { status }); load();
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="label-eyebrow">Courier Partner</div>
            <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight mt-1">{user?.company_name}</h1>
          </div>
          {user?.admin_approved
            ? <Badge className="bg-emerald-600 text-white rounded-sm">APPROVED · ACTIVE</Badge>
            : <Badge className="bg-amber-500 text-white rounded-sm">AWAITING ADMIN APPROVAL</Badge>}
        </div>

        {!user?.admin_approved && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm flex items-center gap-3 mb-6">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <div className="text-sm text-amber-900">Your profile is under review. You will not receive leads until approved by admin.</div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Total Leads" v={stats.total_leads || 0} icon={<Inbox className="w-5 h-5" />} />
          <Stat label="New" v={stats.new_leads || 0} icon={<FileText className="w-5 h-5" />} />
          <Stat label="Rate Cards" v={stats.rate_cards || 0} icon={<FileText className="w-5 h-5" />} />
          <Stat label="Cities Covered" v={stats.cities_covered || 0} icon={<MapPin className="w-5 h-5" />} />
        </div>

        <Tabs defaultValue="leads">
          <TabsList className="rounded-sm bg-slate-100">
            <TabsTrigger data-testid="cd-tab-leads" value="leads" className="rounded-sm">Leads</TabsTrigger>
            <TabsTrigger data-testid="cd-tab-rates" value="rates" className="rounded-sm">Rate Cards</TabsTrigger>
            <TabsTrigger data-testid="cd-tab-coverage" value="coverage" className="rounded-sm">Coverage</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-6">
            <div className="border border-slate-200 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr><th className="p-3">Lead</th><th className="p-3">Business</th><th className="p-3">Route</th><th className="p-3">Weight</th><th className="p-3">Contact</th><th className="p-3">Action</th></tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} className="border-t border-slate-200" data-testid={`cd-lead-${l.id}`}>
                      <td className="p-3 font-mono text-xs">{l.id}</td>
                      <td className="p-3 font-medium">{l.business_name}<div className="text-xs text-slate-500">{l.business_gst}</div></td>
                      <td className="p-3 text-slate-600">{l.pickup_city} → {l.delivery_city}</td>
                      <td className="p-3">{l.weight} kg</td>
                      <td className="p-3 text-xs"><div>{l.business_mobile}</div><div className="text-slate-500">{l.business_email}</div></td>
                      <td className="p-3">
                        <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                          <SelectTrigger data-testid={`cd-lead-status-${l.id}`} className="rounded-sm border-slate-300 w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["new","callback_pending","contacted","quote_sent","won","lost","expired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">No leads yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="rates" className="mt-6 space-y-6">
            <div className="border border-slate-200 p-6 rounded-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="font-display font-semibold text-lg">Add Rate Card</div>
                {(coverage.cities || []).length === 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-sm">Add at least one city below to get started</div>
                )}
              </div>

              {/* Inline quick-add city */}
              <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 mb-4 flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label className="label-eyebrow">+ Add a new city to your coverage</Label>
                  <Input data-testid="rc-quick-city" placeholder="e.g. Mumbai" className="rounded-sm border-slate-300 mt-1.5"
                    value={quickCity} onChange={e => setQuickCity(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); quickAddCity(); } }} />
                </div>
                <Button data-testid="rc-quick-city-add" onClick={quickAddCity} className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm h-10">Add to Coverage</Button>
                <div className="text-xs text-slate-500 basis-full">Currently covering: <b>{(coverage.cities || []).length}</b> {(coverage.cities || []).length === 1 ? "city" : "cities"} {(coverage.cities || []).length > 0 && `· ${coverage.cities.join(", ")}`}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field2 label="Pickup City">
                  <Select value={rcForm.pickup_city} onValueChange={v => setRcForm({...rcForm, pickup_city: v, delivery_city: rcForm.delivery_city === v ? "" : rcForm.delivery_city})}>
                    <SelectTrigger data-testid="rc-pickup" className="rounded-sm border-slate-300"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{(coverage.cities || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field2>
                <Field2 label="Delivery City">
                  <Select value={rcForm.delivery_city} disabled={!rcForm.pickup_city || rcForm.apply_all} onValueChange={v => setRcForm({...rcForm, delivery_city: v})}>
                    <SelectTrigger data-testid="rc-delivery" className="rounded-sm border-slate-300"><SelectValue placeholder={rcForm.apply_all ? "All other cities" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      {(coverage.cities || []).filter(c => c !== rcForm.pickup_city).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field2>
                <Field2 label="Mode"><Select value={rcForm.transport_mode} onValueChange={v => setRcForm({...rcForm, transport_mode: v})}><SelectTrigger data-testid="rc-mode" className="rounded-sm border-slate-300"><SelectValue /></SelectTrigger><SelectContent>{TRANSPORT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></Field2>
                <Field2 label="Slab"><Select value={rcForm.weight_slab} onValueChange={v => setRcForm({...rcForm, weight_slab: v})}><SelectTrigger data-testid="rc-slab" className="rounded-sm border-slate-300"><SelectValue /></SelectTrigger><SelectContent>{SLABS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></Field2>
                <Field2 label="Pricing"><Select value={rcForm.pricing_type} onValueChange={v => setRcForm({...rcForm, pricing_type: v})}><SelectTrigger data-testid="rc-pricing-type" className="rounded-sm border-slate-300"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="per_kg">Per KG</SelectItem><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="minimum">Minimum</SelectItem></SelectContent></Select></Field2>
                <Field2 label="Base Rate ₹"><Input data-testid="rc-base" type="number" className="rounded-sm border-slate-300" value={rcForm.base_rate} onChange={e => setRcForm({...rcForm, base_rate: e.target.value})} /></Field2>
                <Field2 label="Min Charge ₹"><Input type="number" className="rounded-sm border-slate-300" value={rcForm.min_charge} onChange={e => setRcForm({...rcForm, min_charge: e.target.value})} /></Field2>
                <Field2 label="Timeline"><Input className="rounded-sm border-slate-300" value={rcForm.delivery_timeline} onChange={e => setRcForm({...rcForm, delivery_timeline: e.target.value})} /></Field2>
              </div>
              <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input data-testid="rc-apply-all" type="checkbox" className="w-4 h-4 accent-blue-600" checked={!!rcForm.apply_all} onChange={e => setRcForm({...rcForm, apply_all: e.target.checked})} />
                  Apply this rate to <b>all other cities</b> ({Math.max(0, (coverage.cities || []).filter(c => c !== rcForm.pickup_city).length)} destinations)
                </label>
                <Button data-testid="rc-add-btn" onClick={addRc} className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm">
                  {rcForm.apply_all ? "Create Bulk Rate Cards" : "Add Rate Card"}
                </Button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">Route</th><th className="p-3">Mode</th><th className="p-3">Slab</th><th className="p-3">Base</th><th className="p-3">Timeline</th><th></th></tr></thead>
                <tbody>
                  {rateCards.map(r => (
                    <tr key={r.id} className="border-t border-slate-200">
                      <td className="p-3">{r.pickup_city} → {r.delivery_city}</td>
                      <td className="p-3">{r.transport_mode}</td>
                      <td className="p-3">{r.weight_slab}</td>
                      <td className="p-3">₹{r.base_rate}/kg</td>
                      <td className="p-3">{r.delivery_timeline}</td>
                      <td className="p-3 text-right"><Button data-testid={`rc-del-${r.id}`} size="icon" variant="ghost" onClick={() => delRc(r.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="coverage" className="mt-6 space-y-6">
            <CovBlock title="States" items={coverage.states || []} onAdd={(v) => saveCov({ states: [...(coverage.states||[]), v] })} onRemove={(v) => saveCov({ states: coverage.states.filter(x => x !== v) })} placeholder="Maharashtra" testid="cov-state" />
            <CovBlock title="Cities" items={coverage.cities || []} onAdd={(v) => saveCov({ cities: [...(coverage.cities||[]), v] })} onRemove={(v) => saveCov({ cities: coverage.cities.filter(x => x !== v) })} placeholder="Mumbai" testid="cov-city" />
            <CovBlock title="Pincodes" items={coverage.pincodes || []} onAdd={(v) => saveCov({ pincodes: [...(coverage.pincodes||[]), v] })} onRemove={(v) => saveCov({ pincodes: coverage.pincodes.filter(x => x !== v) })} placeholder="400001" testid="cov-pin" />
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
const Field2 = ({ label, children }) => <div><Label className="label-eyebrow">{label}</Label><div className="mt-1.5">{children}</div></div>;

const CovBlock = ({ title, items, onAdd, onRemove, placeholder, testid }) => {
  const [v, setV] = useState("");
  return (
    <div className="border border-slate-200 p-5 rounded-sm">
      <div className="font-display font-semibold text-lg mb-3">{title}</div>
      <div className="flex gap-2">
        <Input data-testid={`${testid}-input`} placeholder={placeholder} className="rounded-sm border-slate-300" value={v} onChange={e => setV(e.target.value)} />
        <Button data-testid={`${testid}-add`} onClick={() => { if (v) { onAdd(v); setV(""); } }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm">Add</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map(i => <Badge key={i} variant="outline" data-testid={`${testid}-item-${i}`} onClick={() => onRemove(i)} className="rounded-sm border-slate-300 cursor-pointer hover:bg-slate-100 px-3 py-1">{i} ×</Badge>)}
      </div>
    </div>
  );
};
