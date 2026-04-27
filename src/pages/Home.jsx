import React from "react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";
import { ArrowRight, Shield, Bell, Users, Building2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream font-inter">
      <PublicNav />

      {/* Hero */}
      <section className="bg-navy text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/20 text-teal text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Shield size={14} />
            Built exclusively for Florida community associations
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
            Compliance is the product.<br />
            <span className="text-teal">Community</span> is the platform.
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The only compliance-led vendor marketplace built around your community's rules. Every vendor has been reviewed and approved by the association. Their COI, contractor license, and credentials are on file.
          </p>
          <p className="text-white/50 text-sm mb-4">Who are you?</p>
        </div>
      </section>

      {/* Audience Cards */}
      <section id="audience-cards" className="bg-cream py-16 px-4 -mt-1">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
            {
              title: "Associations & Managers",
              subtitle: "Free for all Florida community associations",
              desc: "Stop chasing vendor certificates. Build your approved vendor directory with full compliance tracking.",
              cta: "Create Free Account",
              link: "/associations",
              image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
              badge: "Always Free",
              badgeColor: "bg-teal/10 text-teal-dark"
            },
            {
              title: "Vendors & Contractors",
              subtitle: "Beta access — free for 6 months",
              desc: "Get in front of Florida's associations. Get approved. Get to work. Build your compliance profile once.",
              cta: "Join as a Vendor",
              link: "/vendors",
              image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
              badge: "Beta Free",
              badgeColor: "bg-amber-50 text-amber-700"
            },
            {
              title: "Residents & Homeowners",
              subtitle: "Free for all residents",
              desc: "Find trusted vendors for your home — every vendor in your directory has been reviewed and approved by your association.",
              cta: "Sign Up Free",
              link: "/residents",
              image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
              badge: "Always Free",
              badgeColor: "bg-teal/10 text-teal-dark"
            }].
            map((card) =>
            <Link
              key={card.title}
              to={card.link}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-sand-dark transition-all duration-300 hover:-translate-y-1">
              
                <div className="relative h-44 overflow-hidden">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
                  <span className="bg-teal/10 text-[hsl(var(--card))] px-2.5 py-1 text-xs font-semibold rounded-full absolute top-3 right-3">
                    {card.badge}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-navy font-bold text-lg mb-1">{card.title}</h3>
                  <p className="text-teal-dark text-xs font-semibold mb-3">{card.subtitle}</p>
                  <p className="text-body-brown text-sm leading-relaxed mb-4">{card.desc}</p>
                  <div className="flex items-center gap-2 text-teal-dark font-semibold text-sm group-hover:gap-3 transition-all">
                    {card.cta} <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-sand border-y border-sand-dark py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
            { icon: "🏛️", label: "No cost for associations" },
            { icon: "🌴", label: "Built for Florida" },
            { icon: "📋", label: "COIs & licenses on file" },
            { icon: "🔔", label: "Automated expiration alerts" }].
            map((item) =>
            <div key={item.label} className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-navy font-semibold text-sm">{item.label}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Florida Image Section */}
      <section className="py-16 px-4 bg-cream">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-3 rounded-2xl overflow-hidden">
            <img src="https://media.base44.com/images/public/69e9180b18cbe750b3daf184/c8ad32d8d_generated_image.png" alt="Florida condo" className="col-span-2 h-64 w-full object-cover" />
            <div className="flex flex-col gap-3">
              <img src="https://media.base44.com/images/public/69e9180b18cbe750b3daf184/ffabde2a5_generated_image.png" alt="HOA community" className="h-[calc(50%-6px)] w-full object-cover hidden" />
              <img src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80" alt="Community" className="h-[calc(50%-6px)] w-full object-cover hidden" />
            </div>
          </div>
          <div className="text-center mt-10">
            <h2 className="text-3xl font-black text-navy mb-3">Serving all Florida community types</h2>
            <p className="text-body-brown text-base max-w-xl mx-auto">
              Condominiums, HOAs, Cooperatives, CDDs, Condo-Hotels, Dockominiums, Commercial Associations, Mixed-Use Associations, and Mobile Home Communities.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />


    </div>);

}