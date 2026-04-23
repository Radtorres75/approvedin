import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AssociationLayout from "@/components/layout/AssociationLayout";
import ComplianceBadge from "@/lib/complianceBadge";
import { computeDocStatus, FLORIDA_COUNTIES, TRADE_CATEGORIES } from "@/lib/constants";
import { Search, Send, X, Phone, Mail, ToggleLeft, ToggleRight, RefreshCw, Eye } from "lucide-react";

export default function AssociationVendorDirectory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [association, setAssociation] = useState(null);
  const [assocVendors, setAssocVendors] = useState([]);
  const [vendorMap, setVendorMap] = useState({});
  const [docMap, setDocMap] = useState({});
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filterCounty, setFilterCounty] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [inviteModal, setInviteModal] = useState(false);
  const [invite, setInvite] = useState({ email: "", phone: "", method: "email" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadPage(); }, []);

  const loadPage = async () => {
    try {
      setLoading(true); setError(null);
      const currentUser = await base44.auth.me();
      if (!currentUser) { navigate("/signin"); return; }
      if (currentUser.role !== "association_manager") { navigate("/signin"); return; }
      const assocs = await base44.entities.Association.list();
      const assoc = assocs.find(a => a.user_id === currentUser.id) || assocs[0];
      if (!assoc) { navigate("/onboarding"); return; }
      setAssociation(assoc);

      const avs = await base44.entities.AssociationVendor.filter({ association_id: assoc.id });
      setAssocVendors(avs);

      const vMap = {}; const dMap = {};
      await Promise.all(avs.map(async av => {
        const all = await base44.entities.Vendor.list();
        const v = all.find(x => x.id === av.vendor_id);
        if (v) vMap[av.vendor_id] = v;
        const docs = await base44.entities.ComplianceDocument.filter({ vendor_id: av.vendor_id, is_archived: false });
        dMap[av.vendor_id] = docs;
      }));
      setVendorMap(vMap);
      setDocMap(dMap);
    } catch (err) {
      setError("Could not load this page. Please try again.");
    } finally { setLoading(false); }
  };

  const handleToggle = async (av) => {
    setActionLoading(true);
    const newStatus = av.status === "approved" ? "suspended" : "approved";
    await base44.entities.AssociationVendor.update(av.id, {
      status: newStatus,
      suspension_reason: newStatus === "suspended" ? "manager_manual" : undefined,
      is_visible_in_resident_directory: newStatus === "approved",
      suspended_date: newStatus === "suspended" ? new Date().toISOString().split("T")[0] : undefined,
      reactivated_date: newStatus === "approved" ? new Date().toISOString().split("T")[0] : undefined,
    });
    const v = vendorMap[av.vendor_id];
    if (v) {
      await base44.entities.Notification.create({
        user_id: v.user_id,
        notification_type: newStatus === "suspended" ? "vendor_suspended" : "vendor_reactivated",
        title: newStatus === "suspended" ? `Suspended from ${association?.association_name}` : `Reactivated in ${association?.association_name}`,
        message: newStatus === "suspended"
          ? `Your account has been suspended from ${association?.association_name}.`
          : `Your account has been reactivated in ${association?.association_name}.`,
        action_url: "/portal/vendor/associations",
        is_read: false,
      });
    }
    setActionLoading(false);
    loadPage();
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true); setInviteMsg("");
    try {
      const link = `${window.location.origin}/portal/vendor/setup?association=${association.id}`;
      const inv = await base44.entities.VendorInvitation.create({
        association_id: association.id,
        recipient_email: invite.email || null,
        recipient_phone: invite.phone || null,
        invitation_method: invite.method,
        registration_link: link,
        status: "pending",
      });
      await base44.functions.invoke("sendVendorInvitation", { invitation_id: inv.id });
      setInviteMsg("Invitation sent successfully!");
      setInvite({ email: "", phone: "", method: "email" });
    } catch (err) {
      setInviteMsg("Failed to send invitation. Please try again.");
    } finally { setInviteLoading(false); }
  };

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

  const filtered = assocVendors.filter(av => {
    const v = vendorMap[av.vendor_id];
    if (!v) return false;
    const matchTab = tab === "all" || av.status === tab;
    const matchSearch = !search || v.business_name?.toLowerCase().includes(search.toLowerCase());
    const matchCounty = !filterCounty || v.florida_counties_served?.includes(filterCounty);
    const matchCat = !filterCategory || v.trade_categories?.includes(filterCategory);
    return matchTab && matchSearch && matchCounty && matchCat;
  });

  if (loading) return <AssociationLayout title="Vendor Directory"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div></AssociationLayout>;
  if (error) return <AssociationLayout title="Vendor Directory"><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-red-600">{error}</p><button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"><RefreshCw size={14} /> Retry</button></div></AssociationLayout>;

  return (
    <AssociationLayout title="Vendor Directory">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-navy">Vendor Directory</h2>
          <p className="text-body-brown text-sm">{filtered.length} vendor{filtered.length !== 1 ? "s" : ""} shown</p>
        </div>
        <button onClick={() => { setInviteModal(true); setInviteMsg(""); }} className="flex items-center gap-2 bg-teal text-navy font-bold px-4 py-2 rounded-lg text-sm hover:bg-teal-dark transition-colors">
          <Send size={14} /> Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-white rounded-xl border border-sand-dark p-1">
          {["all", "approved", "pending", "rejected", "suspended"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-navy text-white" : "text-body-brown hover:text-navy"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-2.5 text-body-brown" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by business name..."
            className="w-full border border-sand-dark rounded-lg pl-8 pr-4 py-2 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
        </div>
        <select value={filterCounty} onChange={e => setFilterCounty(e.target.value)} className="border border-sand-dark rounded-lg px-3 py-2 text-navy text-sm bg-white">
          <option value="">All Counties</option>
          {FLORIDA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border border-sand-dark rounded-lg px-3 py-2 text-navy text-sm bg-white">
          <option value="">All Categories</option>
          {TRADE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-dark p-12 text-center">
          <p className="text-body-brown text-sm mb-3">No vendors found.</p>
          <button onClick={() => { setInviteModal(true); setInviteMsg(""); }} className="text-teal-dark text-sm font-semibold hover:underline">
            Invite your first vendor →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(av => {
            const v = vendorMap[av.vendor_id];
            if (!v) return null;
            const score = av.compliance_score || 0;
            const scoreColor = score >= 80 ? "bg-teal" : score >= 50 ? "bg-amber-400" : "bg-red-400";
            return (
              <div key={av.id} className="bg-white rounded-2xl border border-sand-dark p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-navy font-bold text-base truncate">{v.business_name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {v.trade_categories?.slice(0, 2).map(cat => (
                        <span key={cat} className="text-xs bg-sand text-body-brown px-2 py-0.5 rounded-full">{cat}</span>
                      ))}
                    </div>
                  </div>
                  <ComplianceBadge status={
                    av.status === "approved" ? "active" :
                    av.status === "pending" ? "pending_review" :
                    av.status === "suspended" ? "suspended" : "expired"
                  } />
                </div>

                {/* Compliance bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-body-brown mb-1">
                    <span>Compliance</span><span>{score}%</span>
                  </div>
                  <div className="h-1.5 bg-sand-dark rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${score}%` }} />
                  </div>
                </div>

                {/* Doc status badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {[["coi","COI"],["trade_license","License"],["workers_comp","WC"],["sunbiz","Sunbiz"]].map(([type, label]) => (
                    <div key={type} className="flex items-center gap-1 text-xs">
                      <span className="text-body-brown">{label}:</span>
                      <ComplianceBadge status={getDocStatus(av.vendor_id, type)} />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {v.business_phone && <a href={`tel:${v.business_phone}`} className="text-xs text-body-brown flex items-center gap-1 hover:text-teal-dark"><Phone size={11} /> {v.business_phone}</a>}
                  {v.business_email && <a href={`mailto:${v.business_email}`} className="text-xs text-body-brown flex items-center gap-1 hover:text-teal-dark"><Mail size={11} /> Email</a>}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSelectedVendor({ av, v, docs: docMap[av.vendor_id] || [] })}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-sand-dark text-navy text-xs font-semibold py-2 rounded-lg hover:bg-sand transition-colors">
                    <Eye size={12} /> View Details
                  </button>
                  {(av.status === "approved" || av.status === "suspended") && (
                    <button onClick={() => handleToggle(av)} disabled={actionLoading}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border transition-colors disabled:opacity-60 ${
                        av.status === "approved"
                          ? "border-sand-dark text-body-brown hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                          : "border-teal/30 text-teal-dark bg-teal/5 hover:bg-teal/10"
                      }`}>
                      {av.status === "approved" ? <><ToggleRight size={14} /> Active</> : <><ToggleLeft size={14} /> Suspended</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-sand sticky top-0 bg-white">
              <h3 className="text-navy font-bold text-lg">{selectedVendor.v.business_name}</h3>
              <button onClick={() => setSelectedVendor(null)}><X size={18} className="text-body-brown" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-body-brown text-sm">{selectedVendor.v.business_description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedVendor.v.business_phone && <div><span className="text-body-brown">Phone:</span> <a href={`tel:${selectedVendor.v.business_phone}`} className="text-navy font-medium">{selectedVendor.v.business_phone}</a></div>}
                {selectedVendor.v.business_email && <div><span className="text-body-brown">Email:</span> <a href={`mailto:${selectedVendor.v.business_email}`} className="text-teal-dark font-medium">{selectedVendor.v.business_email}</a></div>}
                {selectedVendor.v.years_in_business && <div><span className="text-body-brown">Years:</span> <span className="text-navy font-medium">{selectedVendor.v.years_in_business}</span></div>}
              </div>
              {selectedVendor.v.trade_categories?.length > 0 && (
                <div><p className="text-body-brown text-xs font-semibold uppercase tracking-wider mb-2">Trade Categories</p>
                  <div className="flex flex-wrap gap-1">{selectedVendor.v.trade_categories.map(c => <span key={c} className="text-xs bg-sand px-2 py-1 rounded-full text-navy">{c}</span>)}</div>
                </div>
              )}
              <div><p className="text-body-brown text-xs font-semibold uppercase tracking-wider mb-2">Compliance Documents</p>
                <div className="space-y-2">
                  {selectedVendor.docs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-2 border-b border-sand last:border-0">
                      <div>
                        <p className="text-navy text-sm font-medium capitalize">{doc.document_type?.replace(/_/g, " ")}</p>
                        <p className="text-body-brown text-xs">{doc.gl_expiration_date || doc.expiration_date || "No date"}</p>
                      </div>
                      <ComplianceBadge status={computeDocStatus(doc.gl_expiration_date || doc.expiration_date)} />
                    </div>
                  ))}
                  {selectedVendor.docs.length === 0 && <p className="text-body-brown text-sm">No documents on file.</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                {selectedVendor.av.status === "pending" && (
                  <>
                    <button onClick={() => { handleToggle({ ...selectedVendor.av, status: "suspended" }); setSelectedVendor(null); }}
                      className="flex-1 bg-teal text-navy font-bold py-2.5 rounded-xl text-sm">Approve</button>
                    <button onClick={() => setSelectedVendor(null)}
                      className="flex-1 border border-sand-dark text-navy font-medium py-2.5 rounded-xl text-sm">Close</button>
                  </>
                )}
                {(selectedVendor.av.status === "approved" || selectedVendor.av.status === "suspended") && (
                  <button onClick={() => { handleToggle(selectedVendor.av); setSelectedVendor(null); }}
                    className={`flex-1 font-bold py-2.5 rounded-xl text-sm ${selectedVendor.av.status === "approved" ? "bg-red-50 text-red-600" : "bg-teal text-navy"}`}>
                    {selectedVendor.av.status === "approved" ? "Suspend Vendor" : "Reactivate Vendor"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-navy font-bold text-lg">Invite a Vendor</h3>
              <button onClick={() => setInviteModal(false)}><X size={18} className="text-body-brown" /></button>
            </div>
            {inviteMsg && (
              <div className={`text-sm px-4 py-3 rounded-lg mb-4 ${inviteMsg.includes("success") ? "bg-teal/10 text-teal-dark border border-teal/20" : "bg-red-50 text-red-700 border border-red-100"}`}>
                {inviteMsg}
              </div>
            )}
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-navy font-medium text-sm mb-1.5">Delivery method</label>
                <div className="grid grid-cols-3 gap-2">
                  {["email", "sms", "both"].map(m => (
                    <button key={m} type="button" onClick={() => setInvite({ ...invite, method: m })}
                      className={`py-2 rounded-lg border text-xs font-semibold capitalize transition-colors ${invite.method === m ? "bg-navy text-white border-navy" : "border-sand-dark text-body-brown hover:border-navy/30"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {(invite.method === "email" || invite.method === "both") && (
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Email address *</label>
                  <input type="email" value={invite.email} onChange={e => setInvite({ ...invite, email: e.target.value })} required
                    className="w-full border border-sand-dark rounded-lg px-4 py-2.5 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
              )}
              {(invite.method === "sms" || invite.method === "both") && (
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Phone number</label>
                  <input type="tel" value={invite.phone} onChange={e => setInvite({ ...invite, phone: e.target.value })}
                    className="w-full border border-sand-dark rounded-lg px-4 py-2.5 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
              )}
              <button type="submit" disabled={inviteLoading} className="w-full bg-navy text-white font-bold py-3 rounded-xl text-sm hover:bg-navy-mid transition-colors disabled:opacity-60">
                {inviteLoading ? "Sending..." : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AssociationLayout>
  );
}