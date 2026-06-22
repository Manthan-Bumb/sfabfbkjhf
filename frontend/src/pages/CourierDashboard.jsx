import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Inbox, FileText, MapPin, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TRANSPORT_MODES = ["Air Cargo", "Rail Cargo", "Road Transport", "Surface Cargo", "Express Delivery"];
const SLABS = ["1-100 KG", "101-500 KG", "501-1000 KG", "1001-5000 KG", "5001+ KG"];

export default function CourierDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [leads, setLeads] = useState([]);
  const [rateCards, setRateCards] = useState([]);
  const [coverage, setCoverage] = useState({ states: [], cities: [], pincodes: [] });
  const [rcForm, setRcForm] = useState({ pickup_city: "", delivery_city: "", transport_mode: "Road Transport", weight_slab: "1-100 KG", delivery_timeline: "3-5 days", pricing_type: "per_kg", base_rate: 30, min_charge: 500, fuel_pct: 8, handling: 50, insurance_pct: 0.5, pickup_charge: 100, delivery_charge: 100 });
  const [coverAllCities, setCoverAllCities] = useState(true);
  const [covInput, setCovInput] = useState({ city: "", state: "", pincode: "" });

  const coverageCities = useMemo(() => {
    const seen = new Set();
    return (coverage.cities || [])
      .map(city => city.trim())
      .filter(city => {
        const key = city.toLowerCase();
        if (!city || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [coverage.cities]);

  const destinationCities = useMemo(
    () => coverageCities.filter(city => city.toLowerCase() !== rcForm.pickup_city.trim().toLowerCase()),
    [coverageCities, rcForm.pickup_city]
  );

  const load = async () => {
    const [s, l, r, c] = await Promise.all([
      api.get("/courier/dashboard"), api.get("/courier/leads"),
      api.get("/courier/rate-cards"), api.get("/courier/coverage"),
    ]);
    setStats(s.data); setLeads(l.data); setRateCards(r.data); setCoverage(c.data);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const addRc = async () => {
    const pickupCity = rcForm.pickup_city.trim();
    const manualDeliveryCity = rcForm.delivery_city.trim();
    const deliveryTargets = coverAllCities && coverageCities.length > 0 ? destinationCities : [manualDeliveryCity].filter(Boolean);

    if (!pickupCity) return toast.error("Pickup city is required");
    if (deliveryTargets.length === 0) return toast.error("Add at least one delivery city in coverage");

    const payloadBase = {
      ...rcForm,
      pickup_city: pickupCity,
      base_rate: Number(rcForm.base_rate),
      min_charge: Number(rcForm.min_charge),
      fuel_pct: Number(rcForm.fuel_pct),
      handling: Number(rcForm.handling),
      insurance_pct: Number(rcForm.insurance_pct),
      pickup_charge: Number(rcForm.pickup_charge),
      delivery_charge: Number(rcForm.delivery_charge),
    };

    try {
      await Promise.all(deliveryTargets.map(delivery_city => api.post("/courier/rate-cards", { ...payloadBase, delivery_city })));
      toast.success(deliveryTargets.length === 1 ? "Rate card saved" : `${deliveryTargets.length} city routes covered`);
      setRcForm(prev => ({ ...prev, delivery_city: "" }));
      load();
    }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };
  const delRc = async (id) => { await api.delete(`/courier/rate-cards/${id}`); load(); };

  const saveCov = async (next) => {
    const data = { ...coverage, ...next };
    await api.put("/courier/coverage", data);
    setCoverage(data); toast.success("Coverage updated");
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
              <div className="font-display font-semibold text-lg mb-4">Add Rate Card</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field2 label="Pickup City">
                  {coverageCities.length > 0 ? (
                    <Select value={rcForm.pickup_city} onValueChange={v => setRcForm({...rcForm, pickup_city: v, delivery_city: ""})}>
                      <SelectTrigger data-testid="rc-pickup" className="rounded-sm border-slate-300"><SelectValue placeholder="Select pickup city" /></SelectTrigger>
                      <SelectContent>{coverageCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Input data-testid="rc-pickup" className="rounded-sm border-slate-300" value={rcForm.pickup_city} onChange={e => setRcForm({...rcForm, pickup_city: e.target.value})} />
                  )}
                </Field2>
                <Field2 label="Delivery City">
                  {coverageCities.length > 0 ? (
                    <Select value={rcForm.delivery_city} disabled={coverAllCities} onValueChange={v => setRcForm({...rcForm, delivery_city: v})}>
                      <SelectTrigger data-testid="rc-delivery" className="rounded-sm border-slate-300"><SelectValue placeholder={coverAllCities ? "All other cities" : "Select delivery city"} /></SelectTrigger>
                      <SelectContent>{destinationCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Input data-testid="rc-delivery" className="rounded-sm border-slate-300" value={rcForm.delivery_city} onChange={e => setRcForm({...rcForm, delivery_city: e.target.value})} />
                  )}
                </Field2>
                <Field2 label="Mode"><Select value={rcForm.transport_mode} onValueChange={v => setRcForm({...rcForm, transport_mode: v})}><SelectTrigger data-testid="rc-mode" className="rounded-sm border-slate-300"><SelectValue /></SelectTrigger><SelectContent>{TRANSPORT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></Field2>
                <Field2 label="Slab"><Select value={rcForm.weight_slab} onValueChange={v => setRcForm({...rcForm, weight_slab: v})}><SelectTrigger data-testid="rc-slab" className="rounded-sm border-slate-300"><SelectValue /></SelectTrigger><SelectContent>{SLABS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></Field2>
                <Field2 label="Pricing"><Select value={rcForm.pricing_type} onValueChange={v => setRcForm({...rcForm, pricing_type: v})}><SelectTrigger data-testid="rc-pricing-type" className="rounded-sm border-slate-300"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="per_kg">Per KG</SelectItem><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="minimum">Minimum</SelectItem></SelectContent></Select></Field2>
                <Field2 label="Base Rate ₹"><Input data-testid="rc-base" type="number" className="rounded-sm border-slate-300" value={rcForm.base_rate} onChange={e => setRcForm({...rcForm, base_rate: e.target.value})} /></Field2>
                <Field2 label="Min Charge ₹"><Input type="number" className="rounded-sm border-slate-300" value={rcForm.min_charge} onChange={e => setRcForm({...rcForm, min_charge: e.target.value})} /></Field2>
                <Field2 label="Timeline"><Input className="rounded-sm border-slate-300" value={rcForm.delivery_timeline} onChange={e => setRcForm({...rcForm, delivery_timeline: e.target.value})} /></Field2>
              </div>
              {coverageCities.length > 0 && (
                <div className="mt-4 border border-slate-200 bg-slate-50 p-4 rounded-sm">
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <Checkbox data-testid="rc-cover-all" checked={coverAllCities} onCheckedChange={v => setCoverAllCities(Boolean(v))} className="mt-0.5" />
                    <span>
                      <span className="font-medium text-slate-900">Cover all other cities from this pickup city</span>
                      <span className="block text-xs text-slate-500 mt-1">This creates one rate card for each destination city in your coverage list.</span>
                    </span>
                  </label>
                  {rcForm.pickup_city && coverAllCities && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {destinationCities.map(city => <Badge key={city} variant="outline" className="rounded-sm border-slate-300 bg-white">{city}</Badge>)}
                      {destinationCities.length === 0 && <div className="text-xs text-slate-500">Add more coverage cities to create destination routes.</div>}
                    </div>
                  )}
                </div>
              )}
              <Button data-testid="rc-add-btn" onClick={addRc} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-sm">Add Rate Card</Button>
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
