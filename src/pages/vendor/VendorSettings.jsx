import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";

const NAV = [
  { path: "/portal/vendor", label: "Dashboard" },
  { path: "/portal/vendor/documents", label: "Documents" },
  { path: "/portal/vendor/associations", label: "Associations" },
  { path: "/portal/vendor/profile", label: "Profile" },
  { path: "/portal/vendor/settings", label: "Settings" },
];

export default function VendorSettings() {
  const { loading: authLoading, user } = useRoleGuard("vendor");
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    base44.entities.Vendor.filter({ user_id: user.id }).then(v => { setVendor(v[0]); setLoading(false); });
  }, [user]);

  const getBetaInfo = () => {
    if (!vendor?.beta_signup_date) return null;
    const expDate = new Date(vendor.beta_signup_date);
    expDate.setMonth(expDate.getMonth() + 6);
    const diff = Math.ceil((expDate - new Date()) / 86400000);
    return { date: expDate.toLocaleDateString(), daysLeft: diff };
  };

  const betaInfo = getBetaInfo();

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Vendor" userRole="vendor">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-navy mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Account */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <h2 className="text-navy font-bold text-base mb-4">Account Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-sand">
                <span className="text-body-brown text-sm">Email</span>
                <span className="text-navy text-sm font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-sand">
                <span className="text-body-brown text-sm">Account type</span>
                <span className="text-navy text-sm font-medium">Vendor</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-body-brown text-sm">Member since</span>
                <span className="text-navy text-sm font-medium">{vendor?.beta_signup_date}</span>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <h2 className="text-navy font-bold text-base mb-4">Subscription</h2>
            {vendor?.subscription_tier === "beta" && betaInfo ? (
              <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 mb-4">
                <p className="text-teal-dark font-semibold text-sm mb-1">Beta access active</p>
                <p className="text-navy text-sm">{betaInfo.daysLeft > 0 ? `${betaInfo.daysLeft} days remaining (until ${betaInfo.date})` : "Beta period has ended."}</p>
                <p className="text-body-brown text-xs mt-1">Full platform access included. No credit card required.</p>
              </div>
            ) : (
              <div className="bg-sand rounded-xl p-4 mb-4">
                <p className="text-navy font-semibold text-sm">Paid Plan — $19/month</p>
                <p className="text-body-brown text-xs mt-1">All features included. No limitations.</p>
              </div>
            )}
            <p className="text-body-brown text-xs">Pricing is subject to change. Beta subscribers will receive advance notice before any paid tier activates. All subscription fees are non-refundable.</p>
          </div>

          {/* Compliance Status */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <h2 className="text-navy font-bold text-base mb-3">Compliance Status</h2>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                vendor?.overall_compliance_status === "compliant" ? "badge-active" :
                vendor?.overall_compliance_status === "expiring_soon" ? "badge-expiring-soon" : "badge-noncompliant"
              }`}>
                {vendor?.overall_compliance_status?.replace(/_/g, " ") || "Unknown"}
              </div>
              {vendor?.is_suspended && <span className="badge-suspended px-3 py-1.5 rounded-full text-sm font-semibold">Account Suspended</span>}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}