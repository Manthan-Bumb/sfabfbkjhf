import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

const TRANSPORT_MODES = ["Air Cargo", "Rail Cargo", "Road Transport"];
const PARCEL_TYPES = ["Documents", "Electronics", "Industrial Goods", "Machinery", "Fragile Items", "FMCG", "Pharmaceuticals", "General Cargo", "Heavy Cargo"];

export default function FreightSearch({ compact = false }) {
  const nav = useNavigate();
  const [form, setForm] = useState({
    pickup_city: "", delivery_city: "", weight: "", parcel_type: "", transport_mode: "",
    pickup_pincode: "", delivery_pincode: "", pickup_state: "", delivery_state: "",
  });
  const [adv, setAdv] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    const params = Object.fromEntries(Object.entries(form).filter(([_, v]) => v));
    nav(`/search?${new URLSearchParams(params).toString()}`);
  };

  return (
    <div data-testid="freight-search" className={`bg-white border border-slate-200 ${compact ? "p-4" : "p-6 md:p-8"} rounded-sm`}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
        <div>
          <div className="label-eyebrow mb-2">Pickup City</div>
          <Input data-testid="search-pickup" placeholder="e.g. Mumbai" value={form.pickup_city}
            onChange={e => set("pickup_city", e.target.value)}
            className="rounded-sm border-slate-300 focus-visible:ring-blue-600" />
        </div>
        <div>
          <div className="label-eyebrow mb-2">Delivery City</div>
          <Input data-testid="search-delivery" placeholder="e.g. Delhi" value={form.delivery_city}
            onChange={e => set("delivery_city", e.target.value)}
            className="rounded-sm border-slate-300 focus-visible:ring-blue-600" />
        </div>
        <div>
          <div className="label-eyebrow mb-2">Weight (KG)</div>
          <Input data-testid="search-weight" type="number" placeholder="100" value={form.weight}
            onChange={e => set("weight", e.target.value)}
            className="rounded-sm border-slate-300 focus-visible:ring-blue-600" />
        </div>
        <div>
          <div className="label-eyebrow mb-2">Parcel Type</div>
          <Select value={form.parcel_type} onValueChange={v => set("parcel_type", v)}>
            <SelectTrigger data-testid="search-parcel" className="rounded-sm border-slate-300"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{PARCEL_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <div className="label-eyebrow mb-2">Transport Mode</div>
          <Select value={form.transport_mode} onValueChange={v => set("transport_mode", v)}>
            <SelectTrigger data-testid="search-mode" className="rounded-sm border-slate-300"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{TRANSPORT_MODES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {adv && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 pt-4 border-t border-slate-200">
          <div>
            <div className="label-eyebrow mb-2">Pickup State</div>
            <Input data-testid="search-pickup-state" placeholder="Maharashtra" value={form.pickup_state}
              onChange={e => set("pickup_state", e.target.value)} className="rounded-sm border-slate-300" />
          </div>
          <div>
            <div className="label-eyebrow mb-2">Pickup Pincode</div>
            <Input data-testid="search-pickup-pincode" placeholder="400001" value={form.pickup_pincode}
              onChange={e => set("pickup_pincode", e.target.value)} className="rounded-sm border-slate-300" />
          </div>
          <div>
            <div className="label-eyebrow mb-2">Delivery State</div>
            <Input data-testid="search-delivery-state" placeholder="Delhi" value={form.delivery_state}
              onChange={e => set("delivery_state", e.target.value)} className="rounded-sm border-slate-300" />
          </div>
          <div>
            <div className="label-eyebrow mb-2">Delivery Pincode</div>
            <Input data-testid="search-delivery-pincode" placeholder="110001" value={form.delivery_pincode}
              onChange={e => set("delivery_pincode", e.target.value)} className="rounded-sm border-slate-300" />
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button data-testid="search-toggle-advanced" onClick={() => setAdv(a => !a)} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1">
          {adv ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {adv ? "Hide advanced (state + pincode)" : "Add state & pincode"}
        </button>
        <Button data-testid="search-submit-btn" onClick={submit}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm h-11 px-8 text-sm font-semibold tracking-wide">
          <Search className="w-4 h-4 mr-2" /> Get Instant Freight Rates
        </Button>
      </div>
    </div>
  );
}
