import React from "react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";
import { ArrowRight, Home, Search, Star } from "lucide-react";

export default function ResidentsLanding() {
  return (
    <div className="min-h-screen bg-cream">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white py-24 px-4">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1400&q=80" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
            Find trusted vendors<br />
            <span className="text-teal">for your home.</span>
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto mb-8">
            Every vendor in your community directory has been reviewed and approved by your association. Their insurance and licenses are on file.
          </p>
          <Link to="/resident/signup" className="inline-flex items-center gap-2 bg-teal hover:bg-teal-dark text-navy font-bold text-base px-8 py-4 rounded-xl transition-colors">
            Sign Up — It's Free <ArrowRight size={18} />
          </Link>
          <p className="text-white/40 text-sm mt-4">No credit card. Free for residents.</p>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 px-4 bg-cream">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Star className="text-teal" size={24} />, title: "Association-Approved", desc: "Every vendor in your directory has been reviewed and approved by your association — not just any contractor off the street." },
              { icon: <Search className="text-teal" size={24} />, title: "Easy to Browse", desc: "Filter by trade category to find exactly the type of contractor you need for your home." },
              { icon: <Home className="text-teal" size={24} />, title: "Your Community Only", desc: "See only the vendors approved for your specific community — not a generic, unvetted marketplace." },
            ].map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-sand-dark text-center">
                <div className="flex justify-center mb-4">{v.icon}</div>
                <h3 className="text-navy font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-body-brown text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-sand">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-navy text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Find your community", desc: "Search for your condominium or homeowner association." },
              { step: "2", title: "Create your account", desc: "Register with your unit number and contact information." },
              { step: "3", title: "Browse your directory", desc: "Access your association's approved vendor directory and find trusted contractors for any need." },
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

      {/* Image Section */}
      <section className="py-16 px-4 bg-cream">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-4">
          <img src="https://media.base44.com/images/public/69e9180b18cbe750b3daf184/b1ae2e72c_generated_image.png" alt="Florida home" className="rounded-2xl h-64 w-full object-cover" />
          <img src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80" alt="Community" className="rounded-2xl h-64 w-full object-cover" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-4">Join your community today.</h2>
          <p className="text-white/60 text-lg mb-8">Free for all residents. No credit card required. Sign up in minutes.</p>
          <Link to="/resident/signup" className="inline-flex items-center gap-2 bg-teal hover:bg-teal-dark text-navy font-bold text-base px-8 py-4 rounded-xl transition-colors">
            Sign Up Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}