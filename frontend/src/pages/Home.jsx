import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FreightSearch from "@/components/FreightSearch";
import CourierCard from "@/components/CourierCard";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Building2, ArrowRight, Truck, Plane, Train } from "lucide-react";
import SEO from "@/components/SEO";

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "LogScanner",
  "url": "https://cargo-hub-134.preview.emergentagent.com/",
  "description": "India's B2B Logistics Marketplace — verified courier partners across road, rail, air & express cargo.",
  "areaServed": "IN",
  "sameAs": []
};

export default function Home() {
  const [featured, setFeatured] = useState([]);
  useEffect(() => { api.get("/couriers/featured").then(r => setFeatured(r.data)).catch(() => {}); }, []);

  return (
    <div className="bg-white">
      <SEO
        title="India's B2B Freight Marketplace"
        description="Find verified courier and cargo partners across India in 60 seconds. Compare road, rail, air & express freight rates. GST + PAN verified network of 6,400+ partners."
        canonical="https://cargo-hub-134.preview.emergentagent.com/"
        schema={ORGANIZATION_SCHEMA}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7">
              <div className="label-eyebrow">B2B Logistics Marketplace · India</div>
              <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl tracking-tighter mt-4 leading-[1.05]">
                Scan India's freight<br />
                network in <span className="text-blue-600">60 seconds</span>.
              </h1>
              <p className="text-slate-600 text-lg mt-6 max-w-xl leading-relaxed">
                Instant rates from 6,400+ couriers across India. Compare road, rail, air & express cargo — verified by GST, rated by businesses.
              </p>
              <div className="flex gap-3 mt-7">
                <Link to="/auth/business?tab=register">
                  <Button data-testid="hero-cta-business" className="bg-blue-600 hover:bg-blue-700 text-white rounded-sm h-12 px-7 text-sm font-semibold">Sign Up as Business <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
                </Link>
                <Link to="/auth/courier?tab=register">
                  <Button data-testid="hero-cta-courier" variant="outline" className="rounded-sm h-12 px-7 border-slate-300 text-sm font-semibold">List as Partner</Button>
                </Link>
              </div>
            </div>
            <div className="md:col-span-5 space-y-3">
              <div className="bg-slate-900 text-white p-6 rounded-sm">
                <div className="text-[10px] tracking-[0.2em] uppercase text-blue-200 font-bold">Live Network</div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div><div className="font-display text-3xl font-bold">6.4K</div><div className="text-xs text-slate-400">Couriers</div></div>
                  <div><div className="font-display text-3xl font-bold">28+</div><div className="text-xs text-slate-400">States</div></div>
                  <div><div className="font-display text-3xl font-bold">99%</div><div className="text-xs text-slate-400">Match Rate</div></div>
                </div>
              </div>
              <div className="border border-slate-200 p-5 rounded-sm flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <div className="text-sm"><span className="font-semibold">GST + PAN Verified</span> partners only</div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <FreightSearch />
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 grid md:grid-cols-3 gap-6">
        {[
          { icon: <ShieldCheck className="w-6 h-6" />, t: "Verified Companies", d: "Every partner verified via GST & PAN. Bid for trust, not noise." },
          { icon: <Zap className="w-6 h-6" />, t: "Fast Delivery Network", d: "Air, Rail, Road & Express. Compare timelines side-by-side." },
          { icon: <Building2 className="w-6 h-6" />, t: "Trusted Logistics Partners", d: "BlueDart, DTDC, Gati, TCI, VRL and 6000+ regional fleets." },
        ].map((x) => (
          <div key={x.t} className="border border-slate-200 p-7 rounded-sm hover:border-blue-300 transition-all">
            <div className="w-11 h-11 bg-blue-50 text-blue-600 flex items-center justify-center rounded-sm">{x.icon}</div>
            <div className="font-display font-semibold text-xl mt-4">{x.t}</div>
            <div className="text-slate-600 text-sm mt-2 leading-relaxed">{x.d}</div>
          </div>
        ))}
      </section>

      {/* Modes */}
      <section className="bg-slate-50 border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="label-eyebrow">Transport Modes</div>
          <div className="font-display font-bold text-3xl md:text-4xl tracking-tight mt-2">Every freight class, one marketplace.</div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { i: <Truck className="w-5 h-5" />, t: "Road Transport" },
              { i: <Truck className="w-5 h-5" />, t: "Surface Cargo" },
              { i: <Plane className="w-5 h-5" />, t: "Air Cargo" },
              { i: <Train className="w-5 h-5" />, t: "Rail Cargo" },
              { i: <Zap className="w-5 h-5" />, t: "Express Delivery" },
            ].map((m) => (
              <div key={m.t} className="bg-white border border-slate-200 p-5 rounded-sm flex flex-col gap-3 hover:border-blue-300">
                <div className="text-blue-600">{m.i}</div>
                <div className="font-semibold">{m.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Couriers */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="label-eyebrow">Featured Partners</div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight mt-2">Top-rated couriers this week</h2>
          </div>
          <Link to="/search" data-testid="featured-view-all" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all →</Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map(c => <CourierCard key={c.id} c={c} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-16 flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-blue-300 font-bold">Get Started</div>
            <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight mt-3 max-w-xl">Instant freight rates. Verified leads. Zero spam.</h2>
          </div>
          <div className="flex gap-3">
            <Link to="/auth/business?tab=register"><Button data-testid="cta-business" className="bg-blue-600 hover:bg-blue-700 rounded-sm h-12 px-7 text-white">Get Instant Freight Rates</Button></Link>
            <Link to="/auth/courier?tab=register"><Button data-testid="cta-partner" variant="outline" className="rounded-sm h-12 px-7 bg-transparent border-slate-700 hover:bg-slate-800 hover:text-white text-white">Become a Partner</Button></Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
