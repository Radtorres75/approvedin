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
          <div className="bg-teal/10 text-amber-400 mb-6 px-4 py-1.5 text-sm font-medium rounded-full inline-flex items-center gap-2 border border-teal/20">
            <Shield size={14} />
            Free for Florida community associations
          </div>
          <h1 className="text-[hsl(var(--card))] mb-6 text-4xl font-black leading-tight sm:text-5xl md:text-6xl">Tired of chasing insurance certificates?


          </h1>
          <p className="text-[hsl(var(--card))] mb-10 mx-auto text-lg leading-relaxed sm:text-xl max-w-2xl">ApprovedIn automatically tracks vendor COIs, trade licenses, and corporate filings for Florida community associations — so you never have to chase paperwork again

          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/role-select" className="inline-flex items-center gap-2 bg-teal hover:bg-teal-dark text-navy font-bold text-base px-8 py-4 rounded-xl transition-colors">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/signin" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Already have an account? <span className="text-teal font-semibold">Log In</span>
            </Link>
          </div>
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
              image: "https://images.unsplash.com/photo-1748457115128-7981122d3ce4?w=600&q=80",
              badge: "Free",
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
              badge: "Free",
              badgeColor: "bg-teal/10 text-teal-dark"
            }].
            map((card) =>
            <Link
              key={card.title}
              to={card.link}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-sand-dark transition-all duration-300 hover:-translate-y-1">
              
                <div className="relative h-44 overflow-hidden">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="bg-teal/10 text-[hsl(var(--card))] px-2.5 py-1 text-xs font-semibold rounded-full absolute top-3 right-3">
                    Join Free
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
            <img src="https://media.base44.com/images/public/69e9180b18cbe750b3daf184/c8ad32d8d_generated_image.png" alt="Florida condo" className="mx-40 col-span-2 h-64 w-full object-cover" />
            


            
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