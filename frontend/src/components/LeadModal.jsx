import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Timer, CheckCircle2, Package2, ShieldCheck } from "lucide-react";

const PARCEL_TYPES = ["Documents", "Electronics", "Industrial Goods", "Machinery", "Fragile Items", "FMCG", "Pharmaceuticals", "General Cargo", "Heavy Cargo"];
const TRANSPORT_MODES = ["Air Cargo", "Rail Cargo"];
const INSURANCE_PCT = 0.01; // 1% of parcel value

const ACTION_TITLES = {
  callback: "Request Callback",
  quote: "Get Instant Quote",
  booking: "Book Now",
};

export default function LeadModal({ open, onClose, courier, action, prefill = {} }) {
  const [form, setForm] = useState({
    pickup_city: "", delivery_city: "", weight: 100,
    parcel_type: "General Cargo", transport_mode: "Rail Cargo",
    dispatch_date: "", notes: "",
    parcel_value: "", insurance_required: false, temperature_controlled: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(3600);
  const isBooking = action === "booking";
  const insuranceAmount = form.insurance_required ? Math.round((Number(form.parcel_value) || 0) * INSURANCE_PCT) : 0;

  useEffect(() => {
    if (open) { setForm(f => ({ ...f, ...prefill })); setCreated(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!created || isBooking) return;
    setSecondsLeft(3600);
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [created, isBooking]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.pickup_city || !form.delivery_city) { toast.error("Pickup & Delivery required"); return; }
    if (isBooking) {
      if (!form.parcel_value || Number(form.parcel_value) <= 0) { toast.error("Parcel value is required for booking"); return; }
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/leads", {
        ...form,
        weight: Number(form.weight),
        parcel_value: Number(form.parcel_value) || 0,
        courier_id: courier.id, action,
      });
      setCreated(data);
      toast.success(isBooking ? `Booking ${data.id} submitted — awaiting courier approval` : `Lead ${data.id} created`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to create");
    } finally { setSubmitting(false); }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="lead-modal" className="max-w-2xl rounded-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">
            {created
              ? (isBooking ? "Booking Submitted · Pending Courier Approval" : "Lead Created — SLA Active")
              : `${ACTION_TITLES[action] || "Request"} · ${courier?.company_name}`}
          </DialogTitle>
        </DialogHeader>

        {created ? (
          isBooking ? (
            <div className="space-y-4 pt-2">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-sm flex items-start gap-3">
                <Package2 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-900">Booking ID: {created.id}</div>
                  <div className="text-sm text-blue-800 mt-1">Status: <span className="font-semibold uppercase">{created.booking_status?.replace("_", " ")}</span></div>
                  <div className="text-xs text-blue-700 mt-2">Track this booking from your Business Dashboard → Requests tab.</div>
                </div>
              </div>
              {created.insurance_required && (
                <div className="border border-slate-200 p-3 rounded-sm text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-700"><ShieldCheck className="w-4 h-4 text-blue-600" /> Insurance included</span>
                  <span className="font-semibold">₹{Number(created.insurance_amount || 0).toLocaleString("en-IN")}</span>
                </div>
              )}
              <Button data-testid="lead-modal-close" onClick={onClose} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-sm">Close</Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-900">Lead ID: {created.id}</div>
                  <div className="text-sm text-emerald-800 mt-1">Courier partner has been notified.</div>
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
          )
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

            <div className="border-t border-slate-200 pt-4">
              <div className="label-eyebrow mb-3">Parcel Details {isBooking && <span className="text-red-500 normal-case">· Required for booking</span>}</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="label-eyebrow">Parcel Value (₹) {isBooking && "*"}</Label>
                  <Input data-testid="lead-parcel-value" type="number" min="0" placeholder="e.g. 25000"
                    value={form.parcel_value} onChange={e => set("parcel_value", e.target.value)}
                    className="rounded-sm border-slate-300 mt-1.5" />
                  {form.insurance_required && Number(form.parcel_value) > 0 && (
                    <div className="text-[11px] text-blue-700 mt-1.5">+ Insurance premium: <b>₹{insuranceAmount.toLocaleString("en-IN")}</b> (1%)</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" data-testid="lead-insurance-toggle"
                    onClick={() => set("insurance_required", !form.insurance_required)}
                    className={`border rounded-sm px-3 py-2 text-xs font-semibold transition-all ${form.insurance_required ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"}`}>
                    <div className="label-eyebrow text-[9px] mb-0.5">Insurance</div>
                    <div>{form.insurance_required ? "✓ Required" : "Not Required"}</div>
                  </button>
                  <button type="button" data-testid="lead-temp-toggle"
                    onClick={() => set("temperature_controlled", !form.temperature_controlled)}
                    className={`border rounded-sm px-3 py-2 text-xs font-semibold transition-all ${form.temperature_controlled ? "border-cyan-600 bg-cyan-50 text-cyan-700" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"}`}>
                    <div className="label-eyebrow text-[9px] mb-0.5">Temperature</div>
                    <div>{form.temperature_controlled ? "❄ Controlled" : "Non-controlled"}</div>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Label className="label-eyebrow">Special Notes</Label>
              <Textarea data-testid="lead-notes" value={form.notes} onChange={e => set("notes", e.target.value)} className="rounded-sm border-slate-300 mt-1.5" rows={2} />
            </div>

            <Button data-testid="lead-submit-btn" disabled={submitting} onClick={submit}
              className={`w-full rounded-sm h-11 text-white ${isBooking ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}>
              {submitting ? "Sending..." : (isBooking ? `Submit Booking Request` : `Submit ${action === "quote" ? "Quote Request" : "Callback Request"}`)}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
