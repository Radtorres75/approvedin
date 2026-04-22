import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";
import ComplianceBadge from "@/lib/complianceBadge";
import { Search, MapPin, Phone, Mail, Building2 } from "lucide-react";
import { FLORIDA_COUNTIES, ASSOCIATION_TYPES } from "@/lib/constants";

const NAV = [
  { path: "/portal/vendor", label: "Dashboard" },
  { path: "/portal/vendor/documents", label: "Documents" },
  { path: "/portal/vendor/associations", label: "Associations" },
  { path: "/portal/vendor/profile", label: "Profile" },
  { path: "/portal/vendor/settings", label: "Settings" },
];

export default function VendorAssociations() {
  const { loading: authLoading, user } = useRoleGuard("vendor");
  const [vendor, setVendor] = useState(null);
  const [associations, setAssociations] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCounty, setFilterCounty] = useState("");
  const [filterType, setFilterType] = useState("");
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const vendors = await base44.entities.Vendor.filter({ user_id: user.id });
    const v = vendors[0];
    setVendor(v);
    if (!v) { setLoading(false); return; }

    const allAssocs = await base44.entities.Association.filter({ onboarding_complete: true });
    setAssociations(allAssocs);
    const conns = await base44.entities.AssociationVendor.filter({ vendor_id: v.id });
    setMyConnections(conns);
    setLoading(false);
  };

  const getConnectionStatus = (assocId) => {
    return myConnections.find(c => c.association_id === assocId);
  };

  const handleApply = async (assoc) => {
    const existing = getConnectionStatus(assoc.id);
    if (existing) {
      alert("You are already connected to this association.");
      return;
    }
    setApplying(assoc.id);
    try {
      await base44.entities.AssociationVendor.create({
        association_id: assoc.id,
        vendor_id: vendor.id,
        status: "pending",
        added_by: "vendor_applied",
        compliance_score: 0,
        is_visible_in_resident_directory: false,
      });
      await base44.entities.VendorApplication.create({
        vendor_id: vendor.id,
        association_id: assoc.id,
        status: "submitted",
        applied_date: new Date().toISOString().split("T")[0],
      });
      await base44.entities.Notification.create({
        user_id: assoc.user_id,
        notification_type: "application_received",
        title: `New vendor application from ${vendor.business_name}`,
        message: `${vendor.business_name} has applied to join your approved vendor directory. Review the application in your portal.`,
        related_entity_type: "VendorApplication",
        action_url: "/portal/association",
        is_read: false,
      });
      loadData();
    } catch (err) {
      alert("Failed to apply. Please try again.");
    } finally {
      setApplying(null);
    }
  };

  const filtered = associations.filter(a => {
    const matchSearch = !search || a.association_name?.toLowerCase().includes(search.toLowerCase()) || a.city?.toLowerCase().includes(search.toLowerCase());
    const matchCounty = !filterCounty || a.florida_county === filterCounty;
    const matchType = !filterType || a.association_type === filterType;
    return matchSearch && matchCounty && matchType;
  });

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Vendor" userRole="vendor">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-navy mb-6">Association Directory</h1>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-2.5 text-body-brown" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search associations..." className="w-full border border-sand-dark rounded-lg pl-8 pr-4 py-2 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
          </div>
          <select value={filterCounty} onChange={e => setFilterCounty(e.target.value)} className="border border-sand-dark rounded-lg px-3 py-2 text-navy text-sm focus:outline-none bg-white">
            <option value="">All Counties</option>
            {FLORIDA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-sand-dark rounded-lg px-3 py-2 text-navy text-sm focus:outline-none bg-white">
            <option value="">All Types</option>
            {ASSOCIATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sand-dark p-12 text-center">
            <p className="text-body-brown text-sm">No associations found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(assoc => {
              const conn = getConnectionStatus(assoc.id);
              return (
                <div key={assoc.id} className="bg-white rounded-2xl border border-sand-dark p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-navy font-bold text-base">{assoc.association_name}</h3>
                      <p className="text-body-brown text-xs mt-0.5 flex items-center gap-1">
                        <MapPin size={10} /> {assoc.city}, {assoc.florida_county} County
                      </p>
                    </div>
                    <Building2 size={16} className="text-body-brown flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-body-brown text-xs mb-3">{assoc.association_type} · {assoc.number_of_units} units</p>
                  <div className="flex flex-col gap-1 mb-4">
                    {assoc.phone_number && <a href={`tel:${assoc.phone_number}`} className="text-xs text-body-brown flex items-center gap-1.5 hover:text-teal-dark"><Phone size={10} /> {assoc.phone_number}</a>}
                  </div>
                  {assoc.custom_compliance_notes && (
                    <p className="text-body-brown text-xs bg-sand rounded-lg p-2 mb-3 italic">"{assoc.custom_compliance_notes.substring(0, 80)}..."</p>
                  )}
                  {conn ? (
                    <ComplianceBadge status={conn.status === "approved" ? "active" : conn.status === "pending" ? "pending_review" : conn.status === "rejected" ? "expired" : conn.status === "suspended" ? "suspended" : "missing"} className="w-full justify-center py-2 rounded-lg" />
                  ) : (
                    <button onClick={() => handleApply(assoc)} disabled={applying === assoc.id} className="w-full bg-teal text-navy font-bold py-2 rounded-lg text-sm hover:bg-teal-dark transition-colors disabled:opacity-60">
                      {applying === assoc.id ? "Applying..." : "Apply to Join"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}