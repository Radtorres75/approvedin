import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VendorLayout from "@/components/layout/VendorLayout";
import { RefreshCw } from "lucide-react";

export default function VendorSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [notifExpiry, setNotifExpiry] = useState(true);
  const [notifApproval, setNotifApproval] = useState(true);

  useEffect(() => { loadPage(); }, []);

  const loadPage = async () => {
    try {
      setLoading(true); setError(null);
      const currentUser = await base44.auth.me();
      if (!currentUser) { navigate("/signin"); return; }
      if (currentUser.role !== "vendor") { navigate("/signin"); return; }
      setUserEmail(currentUser.email);
      const vendors = await base44.entities.Vendor.filter({ user_id: currentUser.id });
      if (!vendors?.length) { navigate("/portal/vendor/setup"); return; }
      setVendor(vendors[0]);
    } catch (err) {
      setError("Could not load settings. Please try again.");
    } finally { setLoading(false); }
  };

  const getBetaExpiry = () => {
    if (!vendor?.beta_signup_date) return null;
    const exp = new Date(vendor.beta_signup_date);
    exp.setMonth(exp.getMonth() + 6);
    return { date: exp.toLocaleDateString(), days: Math.max(0, Math.ceil((exp - new Date()) / 86400000)) };
  };

  const betaExpiry = getBetaExpiry();

  if (loading) return <VendorLayout title="Settings"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div></VendorLayout>;
  if (error) return <VendorLayout title="Settings"><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-red-600">{error}</p><button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"><RefreshCw size={14} /> Retry</button></div></VendorLayout>;

  return (
    <VendorLayout title="Settings">
      <div className="max-w-2xl space-y-8">
        <h2 className="text-2xl font-black text-navy">Settings</h2>

        {/* Account Details */}
        <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-4">
          <h3 className="text-navy font-bold text-base">Account Details</h3>
          <div>
            <label className="block text-body-brown text-xs font-semibold uppercase tracking-wider mb-1">Email</label>
            <p className="text-navy font-medium">{userEmail}</p>
          </div>
          <div>
            <label className="block text-body-brown text-xs font-semibold uppercase tracking-wider mb-1">Subscription Tier</label>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-teal/10 text-teal-dark capitalize">
              {vendor?.subscription_tier || "Beta"}
            </span>
          </div>
          {betaExpiry && (
            <div>
              <label className="block text-body-brown text-xs font-semibold uppercase tracking-wider mb-1">Beta Access</label>
              <p className="text-navy text-sm">Expires {betaExpiry.date}</p>
              <p className="text-body-brown text-xs">{betaExpiry.days} days remaining</p>
            </div>
          )}
          <div>
            <label className="block text-body-brown text-xs font-semibold uppercase tracking-wider mb-1">Compliance Status</label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize ${
              vendor?.overall_compliance_status === "compliant" ? "bg-teal/10 text-teal-dark" :
              vendor?.overall_compliance_status === "expiring_soon" ? "bg-amber-50 text-amber-600" :
              "bg-red-50 text-red-600"
            }`}>
              {vendor?.overall_compliance_status?.replace(/_/g, " ") || "Noncompliant"}
            </span>
          </div>
          {vendor?.is_suspended && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-700 text-sm font-semibold">⚠ Your account is currently suspended</p>
              <p className="text-red-600 text-xs mt-1">Contact support if you believe this is an error.</p>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-4">
          <h3 className="text-navy font-bold text-base">Notification Preferences</h3>
          <label className="flex items-center justify-between p-3 bg-cream rounded-xl border border-sand-dark cursor-pointer hover:bg-sand transition-colors">
            <div>
              <span className="text-navy font-medium text-sm block">Document expiration reminders</span>
              <span className="text-body-brown text-xs">Receive email alerts when documents are expiring</span>
            </div>
            <input type="checkbox" checked={notifExpiry} onChange={e => setNotifExpiry(e.target.checked)} className="accent-teal w-4 h-4" />
          </label>
          <label className="flex items-center justify-between p-3 bg-cream rounded-xl border border-sand-dark cursor-pointer hover:bg-sand transition-colors">
            <div>
              <span className="text-navy font-medium text-sm block">Association approval notifications</span>
              <span className="text-body-brown text-xs">Receive email alerts when your application is approved or rejected</span>
            </div>
            <input type="checkbox" checked={notifApproval} onChange={e => setNotifApproval(e.target.checked)} className="accent-teal w-4 h-4" />
          </label>
          <p className="text-body-brown text-xs">Notification preferences are saved automatically.</p>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-100 p-6">
          <h3 className="text-red-600 font-bold text-base mb-3">Account Actions</h3>
          <button onClick={() => base44.auth.logout("/")} className="flex items-center gap-2 text-red-600 text-sm font-semibold hover:underline">
            Log Out of ApprovedIn
          </button>
        </div>
      </div>
    </VendorLayout>
  );
}