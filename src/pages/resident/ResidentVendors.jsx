import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";
import { computeDocStatus } from "@/lib/constants";
import ComplianceBadge from "@/lib/complianceBadge";
import { Search, Phone, Mail, MapPin, X } from "lucide-react";
import { TRADE_CATEGORIES } from "@/lib/constants";

const NAV = [
  { path: "/portal/resident/dashboard", label: "Home" },
  { path: "/portal/resident/vendors", label: "Find Vendors" },
  { path: "/portal/resident/profile", label: "Profile" },
  { path: "/portal/resident/notifications", label: "Notifications" },
];

export default function ResidentVendors() {
  const { loading: authLoading, user } = useRoleGuard("resident");
  const [resident, setResident] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [vendorDocs, setVendorDocs] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const residents = await base44.entities.Resident.filter({ user_id: user.id });
    const r = residents[0];
    setResident(r);
    if (!r?.association_id) { setLoading(false); return; }

    const avs = await base44.entities.AssociationVendor.filter({
      association_id: r.association_id,
      status: "approved",
      is_visible_in_resident_directory: true,
    });

    const vendorList = [];
    const docsMap = {};
    for (const av of avs) {
      const vArr = await base44.entities.Vendor.filter({ id: av.vendor_id });
      if (vArr[0] && !vArr[0].is_suspended) {
        vendorList.push(vArr[0]);
        const docs = await base44.entities.ComplianceDocument.filter({ vendor_id: av.vendor_id, is_archived: false });
        docsMap[av.vendor_id] = docs;
      }
    }
    setVendors(vendorList);
    setVendorDocs(docsMap);
    setLoading(false);
  };

  const filtered = vendors.filter(v => {
    const matchSearch = !search || v.business_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || (v.trade_categories || []).includes(filterCat);
    return matchSearch && matchCat;
  });

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Resident" userRole="resident">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-navy mb-2">Approved Vendor Directory</h1>
        <p className="text-body-brown text-sm mb-6">Every vendor listed has been reviewed and approved by your association.</p>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-2.5 text-body-brown" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="w-full border border-sand-dark rounded-lg pl-8 pr-4 py-2 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-sand-dark rounded-lg px-3 py-2 text-navy text-sm focus:outline-none bg-white">
            <option value="">All Categories</option>
            {TRADE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sand-dark p-12 text-center">
            <p className="text-body-brown text-sm">No approved vendors found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(v => (
              <div key={v.id} className="bg-white rounded-2xl border border-sand-dark p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedVendor(v)}>
                <div className="flex items-start gap-3 mb-3">
                  {v.logo_url && <img src={v.logo_url} alt={v.business_name} className="w-12 h-12 rounded-xl object-cover border border-sand-dark flex-shrink-0" />}
                  <div>
                    <h3 className="text-navy font-bold">{v.business_name}</h3>
                    <div className="inline-flex items-center gap-1 bg-teal/10 text-teal-dark text-xs font-semibold px-2 py-0.5 rounded-full mt-1">
                      ✓ Association-Approved
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(v.trade_categories || []).slice(0, 3).map(cat => (
                    <span key={cat} className="text-xs bg-sand text-body-brown px-2 py-0.5 rounded-full">{cat}</span>
                  ))}
                </div>
                <div className="space-y-1">
                  {v.business_phone && <a href={`tel:${v.business_phone}`} onClick={e => e.stopPropagation()} className="text-xs text-body-brown flex items-center gap-1.5 hover:text-teal-dark"><Phone size={10} /> {v.business_phone}</a>}
                  {v.business_email && <a href={`mailto:${v.business_email}`} onClick={e => e.stopPropagation()} className="text-xs text-body-brown flex items-center gap-1.5 hover:text-teal-dark"><Mail size={10} /> {v.business_email}</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedVendor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-sand flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedVendor.logo_url && <img src={selectedVendor.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                <div>
                  <h2 className="text-navy font-black text-lg">{selectedVendor.business_name}</h2>
                  <div className="inline-flex items-center gap-1 bg-teal/10 text-teal-dark text-xs font-semibold px-2 py-0.5 rounded-full">✓ Association-Approved</div>
                </div>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="text-body-brown hover:text-navy"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {selectedVendor.business_description && <p className="text-body-brown text-sm leading-relaxed">{selectedVendor.business_description}</p>}
              <div>
                <p className="text-navy font-semibold text-sm mb-2">Contact</p>
                <div className="space-y-1">
                  {selectedVendor.business_phone && <a href={`tel:${selectedVendor.business_phone}`} className="text-sm text-body-brown flex items-center gap-2 hover:text-teal-dark"><Phone size={14} /> {selectedVendor.business_phone}</a>}
                  {selectedVendor.business_email && <a href={`mailto:${selectedVendor.business_email}`} className="text-sm text-body-brown flex items-center gap-2 hover:text-teal-dark"><Mail size={14} /> {selectedVendor.business_email}</a>}
                </div>
              </div>
              <div>
                <p className="text-navy font-semibold text-sm mb-2">Services</p>
                <div className="flex flex-wrap gap-1">
                  {(selectedVendor.trade_categories || []).map(c => <span key={c} className="text-xs bg-sand text-body-brown px-2 py-1 rounded-full">{c}</span>)}
                </div>
              </div>
              {selectedVendor.florida_counties_served?.length > 0 && (
                <div>
                  <p className="text-navy font-semibold text-sm mb-2">Counties Served</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedVendor.florida_counties_served.map(c => <span key={c} className="text-xs bg-sand text-body-brown px-2 py-1 rounded-full">{c}</span>)}
                  </div>
                </div>
              )}
              {vendorDocs[selectedVendor.id] && (
                <div>
                  <p className="text-navy font-semibold text-sm mb-2">Compliance Documents</p>
                  <div className="space-y-2">
                    {vendorDocs[selectedVendor.id].map(doc => {
                      const expDate = doc.gl_expiration_date || doc.expiration_date;
                      const status = computeDocStatus(expDate);
                      return (
                        <div key={doc.id} className="flex items-center justify-between text-sm py-1.5 border-b border-sand last:border-0">
                          <span className="text-body-brown capitalize">{doc.document_type?.replace(/_/g, " ")}</span>
                          <ComplianceBadge status={doc.workers_comp_option === "hold_harmless" ? "hold_harmless" : doc.workers_comp_option === "do_not_carry" ? "not_carried" : status} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}