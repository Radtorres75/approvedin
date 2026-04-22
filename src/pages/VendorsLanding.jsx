import React, { useState } from "react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";
import { ArrowRight, Star, TrendingUp, MapPin, FileText, Bell } from "lucide-react";
import { TRADE_CATEGORIES } from "@/lib/constants";

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
      <h3 className="text-navy font-black text-2xl mb-2">ROI Calculator</h3>
      <p className="text-body-brown text-sm mb-8">See your potential return on a $19/month subscription.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {[
            { label: "Average job value ($)", value: jobValue, setter: setJobValue, min: 100, max: 50000, step: 100 },
            { label: "Jobs per association per year", value: jobsPerAssoc, setter: setJobsPerAssoc, min: 1, max: 50, step: 1 },
            { label: "Number of associations to reach", value: numAssocs, setter: setNumAssocs, min: 1, max: 67, step: 1 },
            { label: "Close rate (%)", value: closeRate, setter: setCloseRate, min: 1, max: 100, step: 1 },
          ].map(({ label, value, setter, min, max, step }) => (
            <div key={label}>
              <div className="flex justify-between mb-2">
                <label className="text-navy font-medium text-sm">{label}</label>
                <span className="text-teal-dark font-bold text-sm">{label.includes("$") ? `$${value.toLocaleString()}` : label.includes("%") ? `${value}%` : value}</span>
              </div>
              <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={e => setter(Number(e.target.value))}
                className="w-full accent-teal"
              />
            </div>
          ))}
        </div>
        <div className="bg-cream rounded-xl p-6 space-y-4">
          <div>
            <p className="text-body-brown text-xs uppercase tracking-wider font-semibold mb-1">Potential Annual Revenue</p>
            <p className="text-4xl font-black text-teal">${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-body-brown text-xs uppercase tracking-wider font-semibold mb-1">Annual Subscription Cost</p>
            <p className="text-2xl font-bold text-navy">$228/year</p>
            <p className="text-body-brown text-xs">($19 × 12 months)</p>
          </div>
          <div>
            <p className="text-body-brown text-xs uppercase tracking-wider font-semibold mb-1">Estimated ROI</p>
            <p className="text-3xl font-black text-teal">{Number(roi).toLocaleString()}%</p>
          </div>
          <div className="bg-teal/10 rounded-lg p-3">
            <p className="text-teal-dark text-sm font-semibold">Break-even point</p>
            <p className="text-navy text-sm mt-0.5">You only need to close <strong>{breakEven} job{breakEven !== 1 ? "s" : ""}</strong> per year to cover your subscription.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorsLanding() {
  return (
    <div className="min-h-screen bg-cream">
      <PublicNav />

      {/* Beta Banner */}
      <div className="bg-teal text-navy py-3 px-4 text-center text-sm font-semibold">
        🎉 Beta access — full platform free for 6 months from your signup date. No credit card. No commitment.
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white py-24 px-4">
        <div className="absolute inset-0 opacity-15">
          <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
            Get in front of Florida's associations.<br />
            <span className="text-teal">Get approved. Get to work.</span>
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto mb-8">
            Join Florida's only compliance-first vendor network — the directory associations actually trust. Build your profile once. Apply to communities across all 67 Florida counties.
          </p>
          <Link to="/portal/vendor/setup" className="inline-flex items-center gap-2 bg-teal hover:bg-teal-dark text-navy font-bold text-base px-8 py-4 rounded-xl transition-colors">
            Join as a Vendor — Free During Beta <ArrowRight size={18} />
          </Link>
          <p className="text-white/40 text-sm mt-4">$19/month after beta. All subscription fees are non-refundable.</p>
        </div>
      </section>

      {/* Beta Message */}
      <section className="py-14 px-4 bg-teal/5 border-b border-teal/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black text-navy mb-4">Beta Vendor Program</h2>
          <p className="text-body-brown text-base leading-relaxed mb-3">
            We are launching ApprovedIn across Florida and we want vendors to experience the full platform at absolutely no cost during our beta period. No subscription fees. No commission fees. No credit card. Just sign up, get approved into Florida's communities, and see the value for yourself. Beta access is available for up to 6 months from your signup date.
          </p>
          <p className="text-body-brown/70 text-sm italic">Pricing is subject to change. Beta subscribers will receive advance notice before any paid tier activates.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-cream">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-navy text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Create your profile", desc: "Build your business profile with trade categories, counties served, and contact info." },
              { step: "2", title: "Upload your documents", desc: "Upload your COI, trade license, workers comp, and Sunbiz registration." },
              { step: "3", title: "Apply to associations", desc: "Browse all Florida associations and apply to join their approved vendor directory." },
              { step: "4", title: "Get approved & get work", desc: "Once approved, you appear in the resident directory and start receiving work requests." },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl p-6 border border-sand-dark text-center">
                <div className="w-10 h-10 rounded-full bg-teal text-navy font-black text-base flex items-center justify-center mx-auto mb-4">{s.step}</div>
                <h3 className="text-navy font-bold text-base mb-2">{s.title}</h3>
                <p className="text-body-brown text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 px-4 bg-sand">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-navy text-center mb-8">What you get with paid access ($19/month)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Get discovered by Florida associations actively looking for your trade",
              "Apply to associations across all 67 Florida counties",
              "One-click document distribution (not applicable for COIs) to all connected associations simultaneously",
              "Build your compliance profile that travels with you to every association",
              "Automated alerts keep you ahead of every expiration — never lose an association approval because of a lapsed document",
              "Join Florida's only compliance-first vendor network — the directory associations actually trust",
              "Unlimited trade categories and document storage",
              "Priority placement in association vendor searches",
            ].map((v, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-sand-dark">
                <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-teal rounded-full" />
                </div>
                <p className="text-navy text-sm leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trade Categories */}
      <section className="py-16 px-4 bg-cream">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-navy text-center mb-8">All trade categories welcome</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {TRADE_CATEGORIES.map(cat => (
              <span key={cat} className="bg-white border border-sand-dark text-navy text-xs font-medium px-3 py-1.5 rounded-full">{cat}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-16 px-4 bg-sand">
        <div className="max-w-4xl mx-auto">
          <ROICalculator />
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-cream">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-navy text-center mb-10">Simple pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-teal/5 border-2 border-teal rounded-2xl p-8">
              <div className="inline-block bg-teal text-navy text-xs font-bold px-3 py-1 rounded-full mb-4">BETA — NOW</div>
              <div className="text-4xl font-black text-navy mb-1">$0</div>
              <p className="text-body-brown text-sm mb-6">Free for 6 months from signup</p>
              <ul className="space-y-2 mb-6">
                {["Full platform access","All features included","No credit card required","No commission fees"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-navy text-sm"><span className="text-teal">✓</span> {f}</li>
                ))}
              </ul>
              <Link to="/portal/vendor/setup" className="block text-center bg-teal hover:bg-teal-dark text-navy font-bold py-3 rounded-xl transition-colors">
                Join Free During Beta
              </Link>
            </div>
            <div className="bg-white border border-sand-dark rounded-2xl p-8">
              <div className="inline-block bg-navy text-white text-xs font-bold px-3 py-1 rounded-full mb-4">AFTER BETA</div>
              <div className="text-4xl font-black text-navy mb-1">$19<span className="text-lg font-normal text-body-brown">/mo</span></div>
              <p className="text-body-brown text-sm mb-6">All features, no limitations</p>
              <ul className="space-y-2 mb-6">
                {["Unlimited trade categories","Unlimited document storage","Apply to unlimited associations","Automated expiration alerts","Priority placement in searches"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-navy text-sm"><span className="text-teal-dark">✓</span> {f}</li>
                ))}
              </ul>
              <p className="text-xs text-body-brown">All subscription fees are non-refundable.</p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}