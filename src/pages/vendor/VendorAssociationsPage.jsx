import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VendorLayout from "@/components/layout/VendorLayout";
import ComplianceBadge from "@/lib/complianceBadge";
import { FLORIDA_COUNTIES, ASSOCIATION_TYPES } from "@/lib/constants";
import { Search, MapPin, Phone, Building2, RefreshCw } from "lucide-react";

export default function VendorAssociationsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [associations, setAssociations] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCounty, setFilterCounty] = useState("");
  const [filterType, setFilterType] = useState("");
  const [applying, setApplying] = useState(null);

  useEffect(() => { loadPage(); }, []);

  const loadPage = async () => {
    try {
      setLoading(true); setError(null);
      const currentUser = await base44.auth.me();
      if (!currentUser) { navigate("/signin"); return; }
      if (currentUser.role !== "vendor") { navigate("/signin"); return; }
      const vendors = await base44.entities.Vendor.filter({ user_id: currentUser.id });
      if (!vendors?.length) { navigate("/portal/vendor/setup"); return; }
      const v = vendors[0];
      setVendor(v);
      const [allAssocs, conns] = await Promise.all([
        base44.entities.Association.filter({ onboarding_complete: true }),
        base44.entities.AssociationVendor.filter({ vendor_id: v.id }),
      ]);
      setAssociations(allAssocs);
      setMyConnections(conns);
    } catch (err) {
      setError("Could not load associations. Please try again.");
    } finally { setLoading(false); }
  };

  const getConnection = (assocId) => myConnections.find(c => c.association_id === assocId);

  const handleApply = async (assoc) => {
    if (getConnection(assoc.id)) return;
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
        message: `${vendor.business_name} has applied to join your approved vendor directory.`,
        action_url: "/portal/association",
        is_read: false,
      });
      loadPage();
    } catch {
      alert("Failed to apply. Please try again.");
    } finally { setApplying(null); }
  };

  const filtered = associations.filter(a => {
    const matchSearch = !search || a.association_name?.toLowerCase().includes(search.toLowerCase()) || a.city?.toLowerCase().includes(search.toLowerCase());
    const matchCounty = !filterCounty || a.florida_county === filterCounty;
    const matchType = !filterType || a.association_type === filterType;
    return matchSearch && matchCounty && matchType;
  });

  if (loading) return <VendorLayout title="Associations"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div></VendorLayout>;
  if (error) return <VendorLayout title="Associations"><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-red-600">{error}</p><button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"><RefreshCw size={14} /> Retry</button></div></VendorLayout>;

  return (
    <VendorLayout title="Associations">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-navy">Association Connections</h2>
        <p className="text-body-brown text-sm">{associations.length} association{associations.length !== 1 ? "s" : ""} available</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-2.5 text-body-brown" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or city..."
            className="w-full border border-sand-dark rounded-lg pl-8 pr-4 py-2 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
        </div>
        <select value={filterCounty} onChange={e => setFilterCounty(e.target.value)} className="border border-sand-dark rounded-lg px-3 py-2 text-navy text-sm bg-white">
          <option value="">All Counties</option>
          {FLORIDA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-sand-dark rounded-lg px-3 py-2 text-navy text-sm bg-white">
          <option value="">All Types</option>
          {ASSOCIATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-dark p-12 text-center">
          <p className="text-body-brown text-sm">No associations found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(assoc => {
            const conn = getConnection(assoc.id);
            return (
              <div key={assoc.id} className="bg-white rounded-2xl border border-sand-dark p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-navy font-bold text-base truncate">{assoc.association_name}</h3>
                    <p className="text-body-brown text-xs mt-0.5 flex items-center gap-1">
                      <MapPin size={10} /> {assoc.city}, {assoc.florida_county} County
                    </p>
                  </div>
                  <Building2 size={16} className="text-body-brown flex-shrink-0 mt-0.5 ml-2" />
                </div>
                <p className="text-body-brown text-xs mb-3">{assoc.association_type} · {assoc.number_of_units} units</p>
                {assoc.phone_number && (
                  <a href={`tel:${assoc.phone_number}`} className="text-xs text-body-brown flex items-center gap-1.5 hover:text-teal-dark mb-3">
                    <Phone size={10} /> {assoc.phone_number}
                  </a>
                )}
                {assoc.custom_compliance_notes && (
                  <p className="text-body-brown text-xs bg-sand rounded-lg p-2 mb-3 italic line-clamp-2">"{assoc.custom_compliance_notes}"</p>
                )}
                {conn ? (
                  <div className="w-full flex justify-center py-1">
                    <ComplianceBadge status={
                      conn.status === "approved" ? "active" :
                      conn.status === "pending" ? "pending_review" :
                      conn.status === "suspended" ? "suspended" : "expired"
                    } />
                  </div>
                ) : (
                  <button onClick={() => handleApply(assoc)} disabled={applying === assoc.id}
                    className="w-full bg-teal text-navy font-bold py-2 rounded-lg text-sm hover:bg-teal-dark transition-colors disabled:opacity-60">
                    {applying === assoc.id ? "Applying..." : "Apply to Join"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </VendorLayout>
  );
}