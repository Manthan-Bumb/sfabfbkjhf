import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Timer, CheckCircle2 } from "lucide-react";

const PARCEL_TYPES = ["Documents", "Electronics", "Industrial Goods", "Machinery", "Fragile Items", "FMCG", "Pharmaceuticals", "General Cargo", "Heavy Cargo"];
const TRANSPORT_MODES = ["Air Cargo", "Rail Cargo", "Road Transport", "Surface Cargo", "Express Delivery"];

export default function LeadModal({ open, onClose, courier, action, prefill = {} }) {
  const [form, setForm] = useState({
    pickup_city: "", delivery_city: "", weight: 100,
    parcel_type: "General Cargo", transport_mode: "Road Transport",
    dispatch_date: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(3600);

  useEffect(() => {
    if (open) {
      setForm(f => ({ ...f, ...prefill }));
      setCreated(null);
    }
    // eslint-disable-next-line
  }, [open]);

  useEffect(() => {
    if (!created) return;
    setSecondsLeft(3600);
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [created]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.pickup_city || !form.delivery_city) { toast.error("Pickup & Delivery required"); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post("/leads", {
        ...form, weight: Number(form.weight),
        courier_id: courier.id, action,
      });
      setCreated(data);
      toast.success(`Lead ${data.id} created — courier will respond within 60 min`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to create lead");
    } finally { setSubmitting(false); }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="lead-modal" className="max-w-2xl rounded-sm">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">
            {created ? "Lead Created — SLA Active" : `${action === "quote" ? "Get Instant Quote" : "Request Callback"} · ${courier?.company_name}`}
          </DialogTitle>
        </DialogHeader>

        {created ? (
          <div className="space-y-4 pt-2">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-900">Lead ID: {created.id}</div>
                <div className="text-sm text-emerald-800 mt-1">Courier partner has been notified. You will hear back shortly.</div>
              </div>
            </div>
            <div className={`border ${secondsLeft < 900 ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"} p-4 rounded-sm flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Timer className={`w-4 h-4 ${secondsLeft < 900 ? "text-red-600" : "text-slate-700"}`} />
                <span className="label-eyebrow">Callback SLA</span>
              </div>
              <span data-testid="lead-sla-timer" className={`font-display font-bold text-2xl ${secondsLeft < 900 ? "text-red-600" : "text-slate-900"}`}>{fmt(secondsLeft)}</span>
            </div>
            <Button data-testid="lead-modal-close" onClick={onClose} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-sm">Close</Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="label-eyebrow">Pickup City</Label>
                <Input data-testid="lead-pickup" value={form.pickup_city} onChange={e => set("pickup_city", e.target.value)} className="rounded-sm border-slate-300 mt-1.5" />
              </div>
              <div>
                <Label className="label-eyebrow">Delivery City</Label>
                <Input data-testid="lead-delivery" value={form.delivery_city} onChange={e => set("delivery_city", e.target.value)} className="rounded-sm border-slate-300 mt-1.5" />
              </div>
              <div>
                <Label className="label-eyebrow">Weight (kg)</Label>
                <Input data-testid="lead-weight" type="number" value={form.weight} onChange={e => set("weight", e.target.value)} className="rounded-sm border-slate-300 mt-1.5" />
              </div>
              <div>
                <Label className="label-eyebrow">Dispatch Date</Label>
                <Input data-testid="lead-date" type="date" value={form.dispatch_date} onChange={e => set("dispatch_date", e.target.value)} className="rounded-sm border-slate-300 mt-1.5" />
              </div>
              <div>
                <Label className="label-eyebrow">Parcel Type</Label>
                <Select value={form.parcel_type} onValueChange={v => set("parcel_type", v)}>
                  <SelectTrigger data-testid="lead-parcel" className="rounded-sm border-slate-300 mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{PARCEL_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="label-eyebrow">Transport Mode</Label>
                <Select value={form.transport_mode} onValueChange={v => set("transport_mode", v)}>
                  <SelectTrigger data-testid="lead-mode" className="rounded-sm border-slate-300 mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{TRANSPORT_MODES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="label-eyebrow">Special Notes</Label>
              <Textarea data-testid="lead-notes" value={form.notes} onChange={e => set("notes", e.target.value)} className="rounded-sm border-slate-300 mt-1.5" rows={3} />
            </div>
            <Button data-testid="lead-submit-btn" disabled={submitting} onClick={submit} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-sm h-11">
              {submitting ? "Sending..." : `Submit ${action === "quote" ? "Quote Request" : "Callback Request"}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
