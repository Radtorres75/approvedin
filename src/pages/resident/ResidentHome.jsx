import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ResidentLayout from "@/components/layout/ResidentLayout";
import { Users, Phone, Mail, ChevronRight, RefreshCw } from "lucide-react";

export default function ResidentHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resident, setResident] = useState(null);
  const [association, setAssociation] = useState(null);
  const [vendorCount, setVendorCount] = useState(0);

  useEffect(() => { loadPage(); }, []);

  const loadPage = async () => {
    try {
      setLoading(true); setError(null);
      const currentUser = await base44.auth.me();
      if (!currentUser) { navigate("/signin"); return; }
      if (currentUser.role !== "resident") {
        if (currentUser.role === "association_manager") navigate("/portal/association");
        else if (currentUser.role === "vendor") navigate("/portal/vendor");
        else navigate("/signin");
        return;
      }
      const residents = await base44.entities.Resident.filter({ user_id: currentUser.id });
      if (!residents?.length) { navigate("/resident/signup"); return; }
      const r = residents[0];
      setResident(r);

      if (r.association_id) {
        const [assocs, avs] = await Promise.all([
          base44.entities.Association.filter({ onboarding_complete: true }),
          base44.entities.AssociationVendor.filter({ association_id: r.association_id, status: "approved", is_visible_in_resident_directory: true }),
        ]);
        const a = assocs.find(x => x.id === r.association_id) || assocs[0];
        setAssociation(a);
        setVendorCount(avs.length);
      }
    } catch (err) {
      setError("Could not load your dashboard. Please try again.");
    } finally { setLoading(false); }
  };

  const profileComplete = resident?.phone_number && resident?.address;

  if (loading) return <ResidentLayout title="Home"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div></ResidentLayout>;
  if (error) return <ResidentLayout title="Home"><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-red-600">{error}</p><button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"><RefreshCw size={14} /> Retry</button></div></ResidentLayout>;

  return (
    <ResidentLayout title="Home">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-black text-navy">
            Welcome{resident?.first_name ? `, ${resident.first_name}` : ""}! 👋
          </h2>
          {association && (
            <p className="text-body-brown text-sm mt-1">
              {association.association_name} · Unit {resident?.unit_number} ·{" "}
              <span className="capitalize">{resident?.resident_type}</span>
            </p>
          )}
        </div>

        {/* Profile completion prompt */}
        {!profileComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-amber-800 text-sm font-semibold">Complete your profile</p>
              <p className="text-amber-700 text-xs mt-0.5">Some contact information is missing from your profile.</p>
            </div>
            <Link to="/portal/resident/profile" className="flex items-center gap-1 text-amber-700 font-bold text-sm hover:underline">
              Update profile <ChevronRight size={14} />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Browse Vendors */}
          <Link to="/portal/resident/vendors" className="bg-navy rounded-2xl p-6 hover:bg-navy-mid transition-colors group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal/20 flex items-center justify-center">
                <Users size={22} className="text-teal" />
              </div>
              <div>
                <h3 className="text-white font-bold">Browse Approved Vendors</h3>
                <p className="text-white/60 text-xs">{vendorCount} vendor{vendorCount !== 1 ? "s" : ""} available</p>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Find association-approved contractors and service providers for your home.
            </p>
            <div className="flex items-center gap-1 text-teal text-sm font-semibold group-hover:gap-2 transition-all">
              View vendor directory <ChevronRight size={14} />
            </div>
          </Link>

          {/* Association Info */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <h3 className="text-navy font-bold mb-4">Your Association</h3>
            {association ? (
              <div className="space-y-3">
                <div>
                  <p className="text-navy font-semibold">{association.association_name}</p>
                  <p className="text-body-brown text-sm">{association.association_type}</p>
                  <p className="text-body-brown text-sm">{association.city}, {association.florida_county} County</p>
                </div>
                {association.phone_number && (
                  <a href={`tel:${association.phone_number}`} className="flex items-center gap-2 text-body-brown text-sm hover:text-teal-dark">
                    <Phone size={14} /> {association.phone_number}
                  </a>
                )}
                {association.management_company_name && (
                  <p className="text-body-brown text-sm">Managed by: {association.management_company_name}</p>
                )}
              </div>
            ) : (
              <p className="text-body-brown text-sm">No association connected to your account.</p>
            )}
          </div>
        </div>
      </div>
    </ResidentLayout>
  );
}