import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";
import { ArrowRight, Star } from "lucide-react";

const NAV = [
  { path: "/portal/resident/dashboard", label: "Home" },
  { path: "/portal/resident/vendors", label: "Find Vendors" },
  { path: "/portal/resident/profile", label: "Profile" },
  { path: "/portal/resident/notifications", label: "Notifications" },
];

export default function ResidentDashboard() {
  const { loading: authLoading, user } = useRoleGuard("resident");
  const [resident, setResident] = useState(null);
  const [association, setAssociation] = useState(null);
  const [vendorCount, setVendorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const residents = await base44.entities.Resident.filter({ user_id: user.id });
    const r = residents[0];
    setResident(r);
    if (r?.association_id) {
      const assocs = await base44.entities.Association.filter({ id: r.association_id });
      const a = assocs[0];
      setAssociation(a);
      const avs = await base44.entities.AssociationVendor.filter({ association_id: r.association_id, status: "approved", is_visible_in_resident_directory: true });
      setVendorCount(avs.length);
    }
    setLoading(false);
  };

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Resident" userRole="resident">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-navy">
            Welcome{resident?.first_name ? `, ${resident.first_name}` : ""}
          </h1>
          {association && (
            <p className="text-body-brown text-sm mt-1">{association.association_name} · Unit {resident?.unit_number}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
                <Star size={18} className="text-teal" />
              </div>
              <div>
                <h2 className="text-navy font-bold">Approved Vendors</h2>
                <p className="text-body-brown text-xs">{association?.association_name}</p>
              </div>
            </div>
            <p className="text-3xl font-black text-teal mb-2">{vendorCount}</p>
            <p className="text-body-brown text-sm mb-4">Association-approved vendors available in your directory.</p>
            <Link to="/portal/resident/vendors" className="flex items-center gap-2 text-teal-dark font-semibold text-sm hover:gap-3 transition-all">
              Browse vendor directory <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <h2 className="text-navy font-bold mb-4">Your Association</h2>
            {association ? (
              <div className="space-y-2">
                <p className="text-navy font-semibold">{association.association_name}</p>
                <p className="text-body-brown text-sm">{association.association_type}</p>
                <p className="text-body-brown text-sm">{association.city}, {association.florida_county} County</p>
                {association.phone_number && <p className="text-body-brown text-sm">{association.phone_number}</p>}
              </div>
            ) : (
              <p className="text-body-brown text-sm">No association connected.</p>
            )}
          </div>
        </div>

        {(!resident?.phone_number || !resident?.address) && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm font-semibold mb-1">Complete your profile</p>
            <p className="text-amber-700 text-sm mb-2">Some profile information is missing.</p>
            <Link to="/portal/resident/profile" className="text-amber-700 font-semibold text-sm underline">Update profile →</Link>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}