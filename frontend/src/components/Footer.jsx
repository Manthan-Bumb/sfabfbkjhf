import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-20">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <img src="https://customer-assets.emergentagent.com/job_cargo-hub-134/artifacts/qz1020ve_logo.png" alt="LogScanner" className="h-8 w-8 object-cover rounded-sm" />
            <div className="font-display font-bold text-lg"><span className="text-slate-900">Log</span><span className="text-blue-600">Scanner</span></div>
          </div>
          <p className="text-slate-500 mt-3 leading-relaxed">India's instant freight discovery marketplace for verified businesses.</p>
        </div>
        <div>
          <div className="label-eyebrow mb-3">Product</div>
          <ul className="space-y-2 text-slate-600">
            <li>Find Couriers</li><li>Freight Calculator</li><li>API Access</li>
          </ul>
        </div>
        <div>
          <div className="label-eyebrow mb-3">For Partners</div>
          <ul className="space-y-2 text-slate-600">
            <li>List your Service</li><li>Premium Plans</li><li>Lead Management</li>
          </ul>
        </div>
        <div>
          <div className="label-eyebrow mb-3">Company</div>
          <ul className="space-y-2 text-slate-600">
            <li>About</li><li>Pricing</li><li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-500">© 2026 LogScanner India — All rights reserved.</div>
    </footer>
  );
}
