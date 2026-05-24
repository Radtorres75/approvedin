import React from "react";
import { Link } from "react-router-dom";
import { Building2, HardHat, Home, ArrowRight } from "lucide-react";

const ROLES = [
  {
    icon: <Building2 size={32} className="text-teal-dark" />,
    title: "Association or Management Company",
    subtitle: "Free — always",
    desc: "Build your approved vendor directory, track compliance documents, and stop chasing certificates.",
    cta: "Create Association Account",
    link: "/onboarding",
    badge: "Free Forever",
    badgeColor: "bg-teal/10 text-teal-dark border-teal/20",
  },
  {
    icon: <HardHat size={32} className="text-amber-600" />,
    title: "Vendor or Contractor",
    subtitle: "Beta access — free for 6 months",
    desc: "Get approved by Florida associations. Upload your compliance docs once and get discovered.",
    cta: "Join as a Vendor",
    link: "/portal/vendor/setup",
    badge: "Beta Free",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    icon: <Home size={32} className="text-navy" />,
    title: "Resident or Homeowner",
    subtitle: "Free for all residents",
    desc: "Find trusted, association-approved vendors for your home — no guesswork required.",
    cta: "Sign Up as a Resident",
    link: "/resident/signup",
    badge: "Free",
    badgeColor: "bg-teal/10 text-teal-dark border-teal/20",
  },
];

export default function RoleSelect() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <nav className="bg-navy py-4 px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src="https://media.base44.com/images/public/69e9180b18cbe750b3daf184/9a7ce84a1_approvedin-logo-nav-transparent.png"
            alt="ApprovedIn"
            style={{ height: "36px", width: "auto", objectFit: "contain", display: "block" }}
          />
        </Link>
        <Link to="/signin" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
          Already have an account? <span className="text-teal font-semibold">Log In</span>
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-10 max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-black text-navy mb-3">Who are you joining as?</h1>
          <p className="text-body-brown text-base">Pick your role to get started. It only takes a few minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {ROLES.map((role) => (
            <Link
              key={role.title}
              to={role.link}
              className="group bg-white rounded-2xl border border-sand-dark shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col p-7"
            >
              <div className="mb-5">{role.icon}</div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border self-start mb-4 ${role.badgeColor}`}>
                {role.badge}
              </span>
              <h2 className="text-navy font-bold text-lg mb-1 leading-snug">{role.title}</h2>
              <p className="text-teal-dark text-xs font-semibold mb-3">{role.subtitle}</p>
              <p className="text-body-brown text-sm leading-relaxed mb-6 flex-1">{role.desc}</p>
              <div className="flex items-center gap-2 text-navy font-semibold text-sm group-hover:gap-3 transition-all">
                {role.cta} <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <footer className="bg-navy py-4 px-6 text-center">
        <p className="text-white/30 text-xs">© 2026 ApprovedIn. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
