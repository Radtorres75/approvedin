import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ResidentLayout from "@/components/layout/ResidentLayout";
import ComplianceBadge from "@/lib/complianceBadge";
import { computeDocStatus, TRADE_CATEGORIES } from "@/lib/constants";
import { Search, Phone, Mail, X, RefreshCw, CheckCircle } from "lucide-react";

export default function ResidentVendorDirectory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resident, setResident] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [docMap, setDocMap] = useState({});
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadPage(); }, []);

  const loadPage = async () => {
    try {
      setLoading(true); setError(null);
      const currentUser = await base44.auth.me();
      if (!currentUser) { navigate("/signin"); return; }
      if (currentUser.role !== "resident") { navigate("/signin"); return; }
      const residents = await base44.entities.Resident.filter({ user_id: currentUser.id });
      if (!residents?.length) { navigate("/resident/signup"); return; }
      const r = residents[0];
      setResident(r);

      const avs = await base44.entities.AssociationVendor.filter({
        association_id: r.association_id,
        is_visible_in_resident_directory: true,
        status: "approved",
      });

      const allVendors = await base44.entities.Vendor.list();
      const vendorList = [];
      const dMap = {};

      await Promise.all(avs.map(async av => {
        const v = allVendors.find(x => x.id === av.vendor_id);
        if (v) {
          vendorList.push(v);
          const docs = await base44.entities.ComplianceDocument.filter({ vendor_id: v.id, is_archived: false });
          dMap[v.id] = docs;
        }
      }));

      setVendors(vendorList);
      setDocMap(dMap);
    } catch (err) {
      setError("Could not load vendors. Please try again.");
    } finally { setLoading(false); }
  };

  const filtered = vendors.filter(v => {
    const matchSearch = !search || v.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.trade_categories?.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchCat = !filterCategory || v.trade_categories?.includes(filterCategory);
    return matchSearch && matchCat;
  });

  const getDocStatus = (vid, type) => {
    const docs = docMap[vid] || [];
    const doc = docs.find(d => d.document_type === type);
    if (!doc) return "missing";
    if (type === "workers_comp") {
      if (doc.workers_comp_option === "hold_harmless") return "hold_harmless";
      if (doc.workers_comp_option === "do_not_carry") return "not_carried";
    }
    return computeDocStatus(doc.gl_expiration_date || doc.expiration_date);
  };

  if (loading) return <ResidentLayout title="Vendors"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div></ResidentLayout>;
  if (error) return <ResidentLayout title="Vendors"><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-red-600">{error}</p><button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"><RefreshCw size={14} /> Retry</button></div></ResidentLayout>;

  return (
    <ResidentLayout title="Vendors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-navy">Approved Vendors</h2>
          <p className="text-body-brown text-sm">{filtered.length} vendor{filtered.length !== 1 ? "s" : ""} in your association directory</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-2.5 text-body-brown" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..."
              className="w-full border border-sand-dark rounded-lg pl-8 pr-4 py-2 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border border-sand-dark rounded-lg px-3 py-2 text-navy text-sm bg-white">
            <option value="">All Categories</option>
            {TRADE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sand-dark p-12 text-center">
            {vendors.length === 0 ? (
              <>
                <CheckCircle size={36} className="text-sand-dark mx-auto mb-3" />
                <p className="text-body-brown text-sm">Your association has not approved any vendors yet. Check back soon.</p>
              </>
            ) : (
              <p className="text-body-brown text-sm">No vendors match your search.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(v => (
              <button
                key={v.id}
                onClick={() => setSelected(v)}
                className="bg-white rounded-2xl border border-sand-dark p-5 text-left hover:shadow-md transition-shadow hover:border-teal/30"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    {v.logo_url && <img src={v.logo_url} alt="logo" className="w-10 h-10 rounded-lg object-cover mb-2" />}
                    <h3 className="text-navy font-bold text-base truncate">{v.business_name}</h3>
                  </div>
                  <span className="flex-shrink-0 ml-2 text-xs bg-teal/10 text-teal-dark font-semibold px-2 py-0.5 rounded-full">
                    Association-Approved
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {v.trade_categories?.slice(0, 3).map(cat => (
                    <span key={cat} className="text-xs bg-sand text-body-brown px-2 py-0.5 rounded-full">{cat}</span>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {v.business_phone && (
                    <span className="text-xs text-body-brown flex items-center gap-1.5">
                      <Phone size={11} /> {v.business_phone}
                    </span>
                  )}
                  {v.business_email && (
                    <span className="text-xs text-body-brown flex items-center gap-1.5">
                      <Mail size={11} /> {v.business_email}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Vendor Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-sand sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                {selected.logo_url && <img src={selected.logo_url} alt="logo" className="w-10 h-10 rounded-lg object-cover" />}
                <div>
                  <h3 className="text-navy font-bold">{selected.business_name}</h3>
                  <span className="text-xs bg-teal/10 text-teal-dark font-semibold px-2 py-0.5 rounded-full">Association-Approved ✓</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)}><X size={18} className="text-body-brown" /></button>
            </div>
            <div className="p-6 space-y-4">
              {selected.business_description && (
                <p className="text-body-brown text-sm leading-relaxed">{selected.business_description}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {selected.business_phone && (
                  <a href={`tel:${selected.business_phone}`} className="flex items-center gap-2 text-navy hover:text-teal-dark font-medium">
                    <Phone size={14} /> {selected.business_phone}
                  </a>
                )}
                {selected.business_email && (
                  <a href={`mailto:${selected.business_email}`} className="flex items-center gap-2 text-teal-dark hover:underline font-medium">
                    <Mail size={14} /> {selected.business_email}
                  </a>
                )}
              </div>
              {selected.trade_categories?.length > 0 && (
                <div>
                  <p className="text-body-brown text-xs font-semibold uppercase tracking-wider mb-2">Services</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.trade_categories.map(c => <span key={c} className="text-xs bg-sand px-2 py-1 rounded-full text-navy">{c}</span>)}
                  </div>
                </div>
              )}
              {selected.florida_counties_served?.length > 0 && (
                <div>
                  <p className="text-body-brown text-xs font-semibold uppercase tracking-wider mb-2">Counties Served</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.florida_counties_served.map(c => <span key={c} className="text-xs bg-cream border border-sand-dark px-2 py-0.5 rounded-full text-navy">{c}</span>)}
                  </div>
                </div>
              )}

              {/* Compliance section */}
              <div>
                <p className="text-body-brown text-xs font-semibold uppercase tracking-wider mb-2">Compliance Status</p>
                <div className="space-y-2">
                  {[
                    { type: "coi", label: "Certificate of Insurance" },
                    { type: "trade_license", label: "Trade License" },
                    { type: "workers_comp", label: "Workers Compensation" },
                    { type: "sunbiz", label: "Florida Sunbiz" },
                  ].map(({ type, label }) => (
                    <div key={type} className="flex items-center justify-between py-1.5 border-b border-sand last:border-0">
                      <span className="text-navy text-sm">{label}</span>
                      <ComplianceBadge status={getDocStatus(selected.id, type)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ResidentLayout>
  );
}