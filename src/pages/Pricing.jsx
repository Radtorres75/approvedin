import React, { useState } from "react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";
import { ArrowRight } from "lucide-react";

function ROICalculator() {
  const [jobValue, setJobValue] = useState(2500);
  const [jobsPerAssoc, setJobsPerAssoc] = useState(4);
  const [numAssocs, setNumAssocs] = useState(10);
  const [closeRate, setCloseRate] = useState(25);

  const revenue = jobValue * jobsPerAssoc * numAssocs * (closeRate / 100);
  const annualCost = 228;
  const roi = ((revenue - annualCost) / annualCost * 100).toFixed(0);
  const breakEven = Math.ceil(annualCost / (jobValue * (closeRate / 100)));

  return (
    <div className="bg-white rounded-2xl border border-sand-dark p-8 shadow-sm">
      <h3 className="text-navy font-black text-xl mb-6">ROI Calculator</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          {[
            { label: "Average job value ($)", value: jobValue, setter: setJobValue, min: 100, max: 50000, step: 100 },
            { label: "Jobs per association per year", value: jobsPerAssoc, setter: setJobsPerAssoc, min: 1, max: 50, step: 1 },
            { label: "Number of associations", value: numAssocs, setter: setNumAssocs, min: 1, max: 67, step: 1 },
            { label: "Close rate (%)", value: closeRate, setter: setCloseRate, min: 1, max: 100, step: 1 },
          ].map(({ label, value, setter, min, max, step }) => (
            <div key={label}>
              <div className="flex justify-between mb-1.5">
                <label className="text-navy font-medium text-sm">{label}</label>
                <span className="text-teal-dark font-bold text-sm">
                  {label.includes("$") ? `$${value.toLocaleString()}` : label.includes("%") ? `${value}%` : value}
                </span>
              </div>
              <input type="range" min={min} max={max} step={step} value={value} onChange={e => setter(Number(e.target.value))} className="w-full accent-teal" />
            </div>
          ))}
        </div>
        <div className="bg-cream rounded-xl p-6 space-y-4">
          <div>
            <p className="text-body-brown text-xs uppercase tracking-wider font-semibold mb-1">Potential Annual Revenue</p>
            <p className="text-4xl font-black text-teal">${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-body-brown text-xs uppercase tracking-wider font-semibold mb-1">Annual Cost</p>
            <p className="text-2xl font-bold text-navy">$228/year</p>
          </div>
          <div>
            <p className="text-body-brown text-xs uppercase tracking-wider font-semibold mb-1">Estimated ROI</p>
            <p className="text-3xl font-black text-teal">{Number(roi).toLocaleString()}%</p>
          </div>
          <div className="bg-teal/10 rounded-lg p-3">
            <p className="text-teal-dark text-sm font-semibold">Break-even</p>
            <p className="text-navy text-sm mt-0.5">Close just <strong>{breakEven} job{breakEven !== 1 ? "s" : ""}</strong>/year to cover your subscription.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Pricing() {
  return (
    <div className="min-h-screen bg-cream">
      <PublicNav />
      <section className="bg-navy text-white py-20 px-4 text-center">
        <h1 className="text-4xl font-black mb-4">Simple, transparent pricing</h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto">Free for associations and residents. Vendors get full access during beta — $19/month after.</p>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl border-2 border-teal p-8 text-center">
              <div className="text-3xl mb-2">🏛️</div>
              <h3 className="text-navy font-black text-xl mb-2">Associations</h3>
              <div className="text-4xl font-black text-teal mb-2">$0</div>
              <p className="text-body-brown text-sm mb-6">Always free — no exceptions</p>
              <ul className="space-y-2 text-sm text-left mb-6">
                {["All features","Unlimited vendors","Compliance tracking","Expiration alerts","No credit card ever"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-navy"><span className="text-teal">✓</span> {f}</li>
                ))}
              </ul>
              <Link to="/onboarding" className="block bg-teal text-navy font-bold py-3 rounded-xl text-sm hover:bg-teal-dark transition-colors">Create Free Account</Link>
            </div>
            <div className="bg-white rounded-2xl border border-sand-dark p-8 text-center">
              <div className="text-3xl mb-2">🔧</div>
              <h3 className="text-navy font-black text-xl mb-2">Vendors</h3>
              <div className="text-4xl font-black text-navy mb-1">$19<span className="text-lg font-normal text-body-brown">/mo</span></div>
              <div className="text-teal-dark text-sm font-semibold mb-1">Free for 6 months (beta)</div>
              <p className="text-body-brown text-xs mb-6">All subscription fees are non-refundable.</p>
              <ul className="space-y-2 text-sm text-left mb-6">
                {["All features included","Unlimited associations","Document storage","Automated alerts","Priority search placement"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-navy"><span className="text-teal-dark">✓</span> {f}</li>
                ))}
              </ul>
              <Link to="/portal/vendor/setup" className="block bg-navy text-white font-bold py-3 rounded-xl text-sm hover:bg-navy-mid transition-colors">Join Free During Beta</Link>
            </div>
            <div className="bg-white rounded-2xl border-2 border-teal p-8 text-center">
              <div className="text-3xl mb-2">🏠</div>
              <h3 className="text-navy font-black text-xl mb-2">Residents</h3>
              <div className="text-4xl font-black text-teal mb-2">$0</div>
              <p className="text-body-brown text-sm mb-6">Always free — no exceptions</p>
              <ul className="space-y-2 text-sm text-left mb-6">
                {["Browse approved vendors","Contact information","Compliance status","Full vendor profiles","Association directory"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-navy"><span className="text-teal">✓</span> {f}</li>
                ))}
              </ul>
              <Link to="/resident/signup" className="block bg-teal text-navy font-bold py-3 rounded-xl text-sm hover:bg-teal-dark transition-colors">Sign Up Free</Link>
            </div>
          </div>
          <p className="text-center text-body-brown text-sm mb-12">Pricing is subject to change. Beta subscribers will receive advance notice before any paid tier activates.</p>
          <ROICalculator />
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}