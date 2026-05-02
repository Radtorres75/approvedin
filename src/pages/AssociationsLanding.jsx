import React from "react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";
import { ArrowRight, Shield, Bell, FileCheck, Users, CheckCircle, TrendingUp } from "lucide-react";

const FEATURES = [
  { icon: <FileCheck size={20} />, title: "Compliance Document Vault", desc: "All vendor COIs, trade licenses, workers comp, and corporate filings stored, organized, and accessible in one place." },
  { icon: <Bell size={20} />, title: "Automated Expiration Alerts", desc: "Automatic reminders at 90, 60, 30, and 7 days before any document expires — to managers, vendors, and residents." },
  { icon: <Shield size={20} />, title: "Association-Specific Requirements", desc: "Set your own document requirements, minimum GL coverage amounts, and compliance notes for every vendor who applies." },
  { icon: <Users size={20} />, title: "Pre-Approved Vendor Directory", desc: "Build and maintain a curated list of approved, compliant vendors trusted by your community." },
  { icon: <TrendingUp size={20} />, title: "Noncompliance Auto-Detection", desc: "When a vendor document expires, their access is automatically suspended. No manual intervention required." },
  { icon: <CheckCircle size={20} />, title: "Multi-User Access", desc: "Management companies can manage multiple associations from one account." },
];

const PAIN_QUOTES = [
  { quote: "Every renewal cycle I'm chasing five different vendors for their COI. Half the time I get an expired certificate.", author: "HOA Manager, Broward County" },
  { quote: "We had an uninsured contractor do damage. The board blamed management. We had no system to prove we checked.", author: "Community Manager, Palm Beach" },
  { quote: "Keeping track of expiration dates in a spreadsheet is a full-time job. There has to be a better way.", author: "Association Manager, Miami-Dade" },
];

export default function AssociationsLanding() {
  return (
    <div className="min-h-screen bg-cream">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white py-24 px-4">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=80" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/20 text-teal text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Free for Florida associations
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
            Stop chasing vendor certificates.<br />
            <span className="text-teal">Start managing communities.</span>
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            ApprovedIn is free for community associations and managers — because the burden of vendor compliance has been on you long enough. We're here to change that.
          </p>
          <Link to="/onboarding" className="inline-flex items-center gap-2 bg-teal hover:bg-teal-dark text-navy font-bold text-base px-8 py-4 rounded-xl transition-colors">
            Create Your Free Account <ArrowRight size={18} />
          </Link>
          <p className="text-white/40 text-sm mt-4">No credit card. No trial period. No feature caps. Ever.</p>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-4 bg-sand">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-body-brown font-semibold text-sm uppercase tracking-widest mb-4">What managers tell us</p>
          <h2 className="text-3xl font-black text-navy text-center mb-12">Sound familiar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PAIN_QUOTES.map((q, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-sand-dark">
                <p className="text-body-brown text-base leading-relaxed mb-4 italic">"{q.quote}"</p>
                <p className="text-navy font-semibold text-sm">— {q.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 px-4 bg-cream">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-black text-navy mb-4">ApprovedIn fixes this.</h2>
          <p className="text-body-brown text-lg max-w-2xl mx-auto">One system. All your vendors. Full compliance visibility. Zero cost.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-sand-dark hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal mb-4">{f.icon}</div>
              <h3 className="text-navy font-bold text-base mb-2">{f.title}</h3>
              <p className="text-body-brown text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Association Types */}
      <section className="py-16 px-4 bg-sand">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-navy text-center mb-8">Built for every Florida community type</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["Condominium","Homeowners Association","Cooperative","Community Development District","Condo-Hotel","Dockominium","Commercial Association","Mixed-Use Association","Mobile Home & Manufactured Housing"].map(t => (
              <span key={t} className="bg-white border border-sand-dark text-navy text-sm font-medium px-4 py-2 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-cream">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-navy text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create your free account", desc: "Set up your association profile and compliance requirements in under 5 minutes." },
              { step: "2", title: "Invite vendors or set requirements", desc: "Invite vendors directly by email or SMS. Set your specific document requirements." },
              { step: "3", title: "ApprovedIn does the rest", desc: "Automatic alerts, compliance tracking, and real-time status — all handled for you." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-teal text-navy font-black text-lg flex items-center justify-center mx-auto mb-4">{s.step}</div>
                <h3 className="text-navy font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-body-brown text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-4">Ready to take back your time?</h2>
          <p className="text-white/60 text-lg mb-8">Join Florida associations already using ApprovedIn to simplify vendor compliance.</p>
          <Link to="/onboarding" className="inline-flex items-center gap-2 bg-teal hover:bg-teal-dark text-navy font-bold text-base px-8 py-4 rounded-xl transition-colors">
            Create Your Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}