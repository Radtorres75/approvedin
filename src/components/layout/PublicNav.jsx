import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function PublicNav() {
  const [user, setUser] = useState(null);
  const [portalUrl, setPortalUrl] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const me = await base44.auth.me();
        if (!me) return;
        setUser(me);
        // Determine correct portal URL by role
        if (me.role === "association_manager") {
          try {
            const assocs = await base44.entities.Association.filter({ user_id: me.id });
            if (assocs.length > 0) {
              setPortalUrl(assocs[0].onboarding_complete ? "/portal/association" : "/onboarding");
              return;
            }
          } catch {}
          setPortalUrl("/onboarding");
        } else if (me.role === "vendor") {
          try {
            const vendors = await base44.entities.Vendor.filter({ user_id: me.id });
            if (vendors.length > 0) {
              setPortalUrl(vendors[0].setup_highest_completed_step >= 8 ? "/portal/vendor" : "/portal/vendor/setup");
              return;
            }
          } catch {}
          setPortalUrl("/portal/vendor/setup");
        } else if (me.role === "resident") {
          setPortalUrl("/portal/resident/dashboard");
        } else if (me.role === "admin") {
          setPortalUrl("/");
        }
      } catch {}
    };
    checkSession();
  }, []);

  const handleGetStarted = (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      const el = document.getElementById("audience-cards");
      if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
    }
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-navy border-b border-navy-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img
              src="https://media.base44.com/images/public/69e9180b18cbe750b3daf184/9a7ce84a1_approvedin-logo-nav-transparent.png"
              alt="ApprovedIn"
              style={{ height: "32px", width: "auto", objectFit: "contain", display: "block" }}
            />
          </Link>
          <div className="flex items-center gap-3">
            {user && portalUrl ? (
              <button
                onClick={() => navigate(portalUrl)}
                className="flex items-center gap-2 bg-teal hover:bg-teal-dark text-navy font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                My Dashboard
              </button>
            ) : (
              <>
                <Link to="/signin" className="text-white/80 hover:text-white text-sm font-medium transition-colors px-4 py-2">
                  Log In
                </Link>
                <button
                  onClick={handleGetStarted}
                  className="bg-teal hover:bg-teal-dark text-navy font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}