import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function PublicNav() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        try {
          const me = await base44.auth.me();
          setUser(me);
        } catch {}
      }
    });
  }, []);

  const handleGetStarted = (e) => {
    e.preventDefault();

    // If logged in, go to correct portal
    if (user) {
      if (user.role === "association_manager") { window.location.href = "/portal/association"; return; }
      if (user.role === "vendor") { window.location.href = "/portal/vendor"; return; }
      if (user.role === "resident") { window.location.href = "/portal/resident/dashboard"; return; }
    }

    // Not logged in: if on homepage, scroll to audience cards
    if (location.pathname === "/") {
      const el = document.getElementById("audience-cards");
      if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
    }

    // Otherwise navigate to homepage
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-navy border-b border-navy-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
              <span className="text-navy font-black text-sm">A</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">ApprovedIn</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-white/80 hover:text-white text-sm font-medium transition-colors px-4 py-2"
            >
              Log In
            </Link>
            <button
              onClick={handleGetStarted}
              className="bg-teal hover:bg-teal-dark text-navy font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}