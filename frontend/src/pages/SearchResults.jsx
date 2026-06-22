import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FreightSearch from "@/components/FreightSearch";
import CourierCard from "@/components/CourierCard";
import LeadModal from "@/components/LeadModal";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

export default function SearchResults() {
  const [params] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("rate");
  const [modalState, setModalState] = useState({ open: false, courier: null, action: null });
  const { user } = useAuth();

  const search = async () => {
    setLoading(true);
    try {
      const q = Object.fromEntries(params);
      q.sort = sort;
      const { data } = await api.get("/couriers/search", { params: q });
      setResults(data);
    } catch { setResults([]); }
    setLoading(false);
  };
  useEffect(() => { search(); /* eslint-disable-next-line */ }, [params, sort]);

  const action = (c, a) => setModalState({ open: true, courier: c, action: a });

  const prefill = {
    pickup_city: params.get("pickup_city") || "",
    delivery_city: params.get("delivery_city") || "",
    weight: Number(params.get("weight")) || 100,
    parcel_type: params.get("parcel_type") || "General Cargo",
    transport_mode: params.get("transport_mode") || "Road Transport",
  };

  return (
    <div className="bg-white min-h-screen">
      <SEO
        title={`Freight from ${params.get("pickup_city") || "India"} to ${params.get("delivery_city") || "anywhere"}`}
        description={`Compare verified courier partners and freight rates for ${params.get("transport_mode") || "all transport modes"}. Logged-in businesses see live pricing.`}
      />
      <Navbar />
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-10 space-y-6">
        <FreightSearch compact />
        {(!user || user.role !== "business") && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm flex items-center justify-between">
            <div className="flex items-center gap-3"><Lock className="w-4 h-4 text-amber-700" />
              <div className="text-sm text-amber-900"><b>Prices hidden.</b> Login as a verified business to see live rates and contact partners.</div>
            </div>
            <Link to="/auth/business" className="text-sm font-semibold text-blue-600">Login →</Link>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <div className="label-eyebrow">Search Results</div>
            <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight mt-1">{loading ? "Searching..." : `${results.length} courier partners found`}</h2>
          </div>
          <div className="w-48">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger data-testid="sort-select" className="rounded-sm border-slate-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rate">Lowest Rate</SelectItem>
                <SelectItem value="delivery">Fastest Delivery</SelectItem>
                <SelectItem value="rating">Highest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map(c => <CourierCard key={c.id} c={c} onAction={action} />)}
          {!loading && results.length === 0 && (
            <div className="col-span-3 border border-dashed border-slate-300 p-12 text-center rounded-sm text-slate-500">No couriers matched. Try a broader route.</div>
          )}
        </div>
      </section>

      <LeadModal open={modalState.open} onClose={() => setModalState({ open: false, courier: null, action: null })}
        courier={modalState.courier} action={modalState.action} prefill={prefill} />
      <Footer />
    </div>
  );
}
