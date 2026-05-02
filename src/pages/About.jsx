import React from "react";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";

export default function About() {
  return (
    <div className="min-h-screen bg-cream">
      <PublicNav />
      <section className="relative bg-navy text-white py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=80" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black mb-4">The Story Behind ApprovedIn</h1>
          <p className="text-teal text-lg font-semibold">Born from real frustration. Built for real protection.</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          <div>
            <h2 className="text-2xl font-black text-navy mb-4">How It Started</h2>
            <div className="prose prose-sm max-w-none text-body-brown leading-relaxed space-y-4">
              <p>Florida's community associations have long faced a uniquely difficult challenge: managing vendor compliance in a market where the stakes are high, the liability is real, and the tools are woefully inadequate. Association managers were tracking COI expiration dates in spreadsheets. Residents were calling contractors found on flyers, with no way to know if they were insured. And associations were discovering too late — after damage was done — that an approved vendor had let their insurance lapse months ago.</p>
              <p>ApprovedIn was built to solve exactly this problem. Not with a generic contractor marketplace, but with a system built from the ground up around Florida's community association ecosystem — its specific document requirements, its county-by-county vendor landscape, and the real daily pressures faced by managers, vendors, and residents alike.</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-navy mb-4">Our Mission</h2>
            <p className="text-body-brown leading-relaxed text-lg font-medium italic border-l-4 border-teal pl-4">
              "Every vendor in your directory. Approved. On file."
            </p>
            <p className="text-body-brown leading-relaxed mt-4">
              Our mission is to make compliance the standard — not the exception — for every contractor working inside a Florida community. We believe associations deserve to know, at a glance, that every vendor they've approved is still fully insured, licensed, and in good standing. We believe vendors deserve a way to demonstrate that status clearly and earn the trust of every community they serve. And we believe residents deserve to browse a directory they can actually trust.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <img src="https://media.base44.com/images/public/69e9180b18cbe750b3daf184/2af3399cd_generated_image.png" alt="Florida community" className="rounded-2xl h-48 w-full object-cover" />
            <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80" alt="HOA community" className="rounded-2xl h-48 w-full object-cover" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-navy mb-6">What We Stand For</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: "🛡️", title: "Compliance First", desc: "Every feature, every decision, every design choice revolves around keeping communities protected and vendors accountable." },
                { icon: "🆓", title: "Free for Associations", desc: "The burden of vendor compliance has historically fallen on associations. We're funded through vendor access fees — never association fees." },
                { icon: "🏆", title: "Earned Access", desc: "Vendors earn their place in the directory by meeting association-specific requirements. There are no shortcuts." },
              ].map(v => (
                <div key={v.title} className="bg-white rounded-2xl border border-sand-dark p-6 text-center">
                  <div className="text-3xl mb-3">{v.icon}</div>
                  <h3 className="text-navy font-bold text-base mb-2">{v.title}</h3>
                  <p className="text-body-brown text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}