import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

// One-time utility page: detects what role a logged-in user should have
// based on existing entity records, and fixes their role via updateMe.
export default function FixMyRole() {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fix();
  }, []);

  const fix = async () => {
    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        setStatus("error");
        setMessage("You need to be logged in. Please sign in first.");
        return;
      }

      const user = await base44.auth.me();

      // Check for association record
      const assocs = await base44.entities.Association.filter({ user_id: user.id });
      if (assocs.length > 0) {
        await base44.auth.updateMe({ role: "association_manager" });
        setStatus("done");
        setMessage(`Role updated to association_manager. Redirecting to your portal...`);
        setTimeout(() => { window.location.href = "/portal/association"; }, 2000);
        return;
      }

      // Check for vendor record
      const vendors = await base44.entities.Vendor.filter({ user_id: user.id });
      if (vendors.length > 0) {
        await base44.auth.updateMe({ role: "vendor" });
        setStatus("done");
        setMessage(`Role updated to vendor. Redirecting to your portal...`);
        setTimeout(() => { window.location.href = "/portal/vendor"; }, 2000);
        return;
      }

      // Check for resident record
      const residents = await base44.entities.Resident.filter({ user_id: user.id });
      if (residents.length > 0) {
        await base44.auth.updateMe({ role: "resident" });
        setStatus("done");
        setMessage(`Role updated to resident. Redirecting to your portal...`);
        setTimeout(() => { window.location.href = "/portal/resident/dashboard"; }, 2000);
        return;
      }

      setStatus("error");
      setMessage("No profile record found for your account. Please complete signup.");
    } catch (err) {
      setStatus("error");
      setMessage(err?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-sand-dark p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
          {status === "checking" && <div className="w-6 h-6 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />}
          {status === "done" && <span className="text-2xl">✓</span>}
          {status === "error" && <span className="text-2xl">⚠️</span>}
        </div>
        <h1 className="text-xl font-black text-navy mb-2">
          {status === "checking" ? "Fixing your account..." : status === "done" ? "Role fixed!" : "Could not fix role"}
        </h1>
        {message && <p className="text-body-brown text-sm mb-4">{message}</p>}
        {status === "error" && (
          <div className="space-y-2">
            <Link to="/signin" className="block w-full bg-navy text-white font-bold py-2.5 rounded-xl text-sm hover:bg-navy-mid transition-colors">
              Go to Sign In
            </Link>
            <Link to="/onboarding" className="block w-full border border-sand-dark text-navy font-medium py-2.5 rounded-xl text-sm hover:bg-sand transition-colors">
              Register as Association
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}