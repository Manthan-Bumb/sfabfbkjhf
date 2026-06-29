import React from "react";
import { Star, Lock, Truck, Phone, Mail, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function CourierCard({ c, onAction }) {
  const locked = c.locked;
  return (
    <div data-testid={`courier-card-${c.id}`} className="border border-slate-200 hover:border-blue-300 transition-all rounded-sm bg-white p-5 hover:-translate-y-0.5 hover:shadow-md duration-300 relative">
      {c.spot_price && (
        <div className="absolute -top-2 left-3 bg-amber-400 text-slate-900 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-sm" data-testid={`spot-badge-${c.id}`}>
          <Zap className="w-3 h-3 fill-slate-900" /> SPOT PRICE · BOOK IN {c.spot_expires_days}D
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center font-bold rounded-sm">
              {c.company_name?.[0]}
            </div>
            <div>
              <div className="font-display font-semibold text-lg leading-tight">{c.company_name}</div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                <span className="text-slate-700 font-medium">{c.rating}</span>
                <span>· {c.years_experience}+ yrs</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {c.is_premium && <Badge className="bg-blue-600 text-white rounded-sm text-[10px]">PREMIUM</Badge>}
          {c.is_featured && <Badge variant="outline" className="rounded-sm border-slate-300 text-[10px]">FEATURED</Badge>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="label-eyebrow">Mode</div>
          <div className="flex items-center gap-1.5 mt-1 text-slate-800"><Truck className="w-3.5 h-3.5" /> {c.transport_mode || "Multiple"}</div>
        </div>
        <div>
          <div className="label-eyebrow">Delivery</div>
          <div className="flex items-center gap-1.5 mt-1 text-slate-800"><Clock className="w-3.5 h-3.5" /> {c.delivery_timeline}</div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-slate-200 flex items-end justify-between gap-3">
        <div className="flex-1">
          <div className="label-eyebrow flex items-center gap-1.5">
            {c.spot_price ? <><Zap className="w-3 h-3 text-amber-500" /> Spot Rate</> : "Estimated Rate"}
          </div>
          <div className={`mt-1 text-2xl font-display font-bold ${locked ? "blur-locked" : c.spot_price ? "text-amber-600" : "text-slate-900"}`}>
            ₹{locked ? "12,450" : (c.estimated_rate ? c.estimated_rate.toLocaleString("en-IN") : "—")}
          </div>
          {!locked && c.contact_person && (
            <div className="mt-2 text-xs text-slate-500 flex flex-col gap-0.5">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
            </div>
          )}
        </div>

        {locked ? (
          <Link to="/auth/business">
            <Button data-testid={`view-rates-btn-${c.id}`} className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm">
              <Lock className="w-3.5 h-3.5 mr-1.5" /> Login To View
            </Button>
          </Link>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Button data-testid={`book-btn-${c.id}`} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm" onClick={() => onAction?.(c, "booking")}>Book Now</Button>
            <Button data-testid={`quote-btn-${c.id}`} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm" onClick={() => onAction?.(c, "quote")}>Get Quote</Button>
            <Button data-testid={`callback-btn-${c.id}`} size="sm" variant="outline" className="rounded-sm border-slate-300" onClick={() => onAction?.(c, "callback")}>Callback</Button>
          </div>
        )}
      </div>
    </div>
  );
}
