import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AssociationLayout from "@/components/layout/AssociationLayout";
import ComplianceBadge from "@/lib/complianceBadge";
import { computeDocStatus } from "@/lib/constants";
import {
  AlertTriangle, Users, FileCheck, Clock, CheckCircle, Send, Search,
  Mail, RefreshCw, X, ChevronRight, Copy, Check, UserPlus
} from "lucide-react";

export default function AssociationDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [association, setAssociation] = useState(null);
  const [assocVendors, setAssocVendors] = useState([]);
  const [vendorMap, setVendorMap] = useState({});
  const [documents, setDocuments] = useState([]);
  const [pendingApps, setPendingApps] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [residents, setResidents] = useState([]);
  const [copied, setCopied] = useState(false);
  const [residentModal, setResidentModal] = useState(false);

  useEffect(() => { loadPage(); }, []);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = await base44.auth.me();
      if (!currentUser) { navigate("/signin"); return; }
      if (currentUser.role !== "association_manager") {
        if (currentUser.role === "vendor") navigate("/portal/vendor");
        else if (currentUser.role === "resident") navigate("/portal/resident/dashboard");
        else navigate("/signin");
        return;
      }
      const assocs = await base44.entities.Association.list();
      const assoc = assocs.find(a => a.user_id === currentUser.id) || assocs[0];
      if (!assoc) { navigate("/onboarding"); return; }
      if (!assoc.onboarding_complete) { navigate("/onboarding"); return; }
      setAssociation(assoc);

      const [avs, apps, invs, res] = await Promise.all([
        base44.entities.AssociationVendor.filter({ association_id: assoc.id }),
        base44.entities.AssociationVendor.filter({ association_id: assoc.id, status: "pending" }),
        base44.entities.VendorInvitation.filter({ association_id: assoc.id }),
        base44.entities.Resident.filter({ association_id: assoc.id }),
      ]);
      setAssocVendors(avs);
      setPendingApps(apps);
      setInvitations(invs);
      setResidents(res);

      const vendorIds = [...new Set(avs.map(av => av.vendor_id))];
      const vMap = {};
      const allDocs = [];
      await Promise.all(vendorIds.map(async vid => {
        const vArr = await base44.entities.Vendor.filter({ user_id: vid }).catch(() => []);
        // try by id too
        const vById = await base44.entities.Vendor.list().then(all => all.find(v => v.id === vid)).catch(() => null);
        const v = vArr[0] || vById;
        if (v) vMap[vid] = v;
        const docs = await base44.entities.ComplianceDocument.filter({ vendor_id: vid, is_archived: false });
        allDocs.push(...docs);
      }));
      setVendorMap(vMap);
      setDocuments(allDocs);
    } catch (err) {
      console.error(err);
      setError("Could not load this page. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const in7 = new Date(now); in7.setDate(now.getDate() + 7);
  const in60 = new Date(now); in60.setDate(now.getDate() + 60);
  const in90 = new Date(now); in90.setDate(now.getDate() + 90);

  const getDates = d => [d.gl_expiration_date, d.auto_expiration_date, d.umbrella_expiration_date, d.professional_expiration_date, d.expiration_date].filter(Boolean);
  const urgentDocs = documents.filter(d => getDates(d).some(dt => { const e = new Date(dt); return e >= now && e <= in7; }));
  const expiringDocs = documents.filter(d => getDates(d).some(dt => { const e = new Date(dt); return e >= now && e <= in90; }));
  const expiredDocs = documents.filter(d => computeDocStatus(d.gl_expiration_date || d.expiration_date) === "expired");
  const approvedVendors = assocVendors.filter(av => av.status === "approved");
  const in60Docs = documents.filter(d => getDates(d).some(dt => { const e = new Date(dt); return e >= now && e <= in60; }));
  const openInvitations = invitations.filter(i => i.status === "pending" || i.status === "sent");

  const healthScore = approvedVendors.length === 0 ? 100 : Math.round(
    (approvedVendors.filter(av => av.compliance_score === 100).length / approvedVendors.length) * 100
  );
  const healthColor = healthScore > 80 ? "#27c99a" : healthScore >= 50 ? "#f59e0b" : "#ef4444";

  const handleApprove = async (av) => {
    setActionLoading(true);
    await base44.entities.AssociationVendor.update(av.id, {
      status: "approved",
      approved_date: new Date().toISOString().split("T")[0],
      is_visible_in_resident_directory: true,
    });
    const v = vendorMap[av.vendor_id];
    if (v) {
      await base44.entities.Notification.create({
        user_id: v.user_id,
        notification_type: "vendor_approved",
        title: `Application approved by ${association.association_name}`,
        message: `Your application to join ${association.association_name} has been approved.`,
        action_url: "/portal/vendor/associations",
        is_read: false,
      });
    }
    setActionLoading(false);
    loadPage();
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    await base44.entities.AssociationVendor.update(rejectModal.id, {
      status: "rejected",
      rejected_date: new Date().toISOString().split("T")[0],
      rejection_reason: rejectReason,
    });
    setRejectModal(null);
    setRejectReason("");
    setActionLoading(false);
    loadPage();
  };

  const handleReRequest = async (doc) => {
    const v = vendorMap[doc.vendor_id];
    if (!v) return;
    try {
      await base44.integrations.Core.SendEmail({
        to: v.business_email,
        subject: `Document renewal requested by ${association?.association_name}`,
        body: `${association?.association_name} is requesting you renew your ${doc.document_type.replace(/_/g, " ")} document. Please log in to your ApprovedIn vendor portal: ${window.location.origin}/portal/vendor/documents`,
      });
      await base44.entities.Notification.create({
        user_id: v.user_id,
        notification_type: "document_expiring",
        title: `Document renewal requested`,
        message: `${association?.association_name} is requesting you renew your ${doc.document_type.replace(/_/g, " ")} document.`,
        action_url: "/portal/vendor/documents",
        is_read: false,
      });
      alert("Re-request sent successfully.");
    } catch { alert("Failed to send. Please try again."); }
  };

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - healthScore / 100);

  if (loading) return (
    <AssociationLayout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
      </div>
    </AssociationLayout>
  );

  if (error) return (
    <AssociationLayout title="Dashboard">
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-600">{error}</p>
        <button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    </AssociationLayout>
  );

  return (
    <AssociationLayout title="Dashboard">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-navy">{association?.association_name}</h2>
          <p className="text-body-brown text-sm">{association?.association_type} · {association?.florida_county} County</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/portal/association/vendors" className="flex items-center gap-1.5 border border-sand-dark text-navy text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sand transition-colors">
            <Search size={14} /> Search Vendors
          </Link>
          <button
            onClick={() => navigate("/portal/association/vendors")}
            className="flex items-center gap-1.5 bg-teal text-navy text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-dark transition-colors"
          >
            <Send size={14} /> Invite a Vendor
          </button>
          <button
            onClick={() => setResidentModal(true)}
            className="flex items-center gap-1.5 border border-teal text-teal-dark text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal/10 transition-colors"
          >
            <UserPlus size={14} /> Invite Residents
          </button>
        </div>
      </div>

      {/* Urgent Banner */}
      {urgentDocs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm font-semibold">
            URGENT: {urgentDocs.length} vendor document{urgentDocs.length > 1 ? "s" : ""} expire{urgentDocs.length === 1 ? "s" : ""} within 7 days — immediate action required.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
        {/* Compliance Health Score */}
        <div className="bg-white rounded-2xl border border-sand-dark p-6 flex flex-col items-center justify-center">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#e8e1d6" strokeWidth="12" />
            <circle
              cx="70" cy="70" r={radius} fill="none"
              stroke={healthColor} strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
            <text x="70" y="65" textAnchor="middle" fontSize="28" fontWeight="900" fill="#0d1b2a">{healthScore}%</text>
            <text x="70" y="85" textAnchor="middle" fontSize="11" fill="#7a6e62">Health Score</text>
          </svg>
          <p className="text-xs text-body-brown mt-2 text-center">Compliance health across all approved vendors</p>
        </div>

        {/* Stat Cards */}
        <div className="xl:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Approved Vendors", value: approvedVendors.length, icon: <Users size={18} className="text-teal" /> },
            { label: "Expiring Soon (60d)", value: in60Docs.length, icon: <Clock size={18} className="text-amber-500" /> },
            { label: "Expired Documents", value: expiredDocs.length, icon: <AlertTriangle size={18} className="text-red-500" /> },
            { label: "Documents on File", value: documents.length, icon: <FileCheck size={18} className="text-teal" /> },
            { label: "Pending Applications", value: pendingApps.length, icon: <Users size={18} className="text-amber-500" /> },
            { label: "Open Invitations", value: openInvitations.length, icon: <Send size={18} className="text-body-brown" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-sand-dark">
              <div className="flex items-center justify-between mb-1">{s.icon}<span className="text-2xl font-black text-navy">{s.value}</span></div>
              <p className="text-body-brown text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Documents */}
        <div className="bg-white rounded-2xl border border-sand-dark p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-navy font-bold">Expiring Documents</h3>
            <Link to="/portal/association/documents" className="text-teal-dark text-xs font-semibold hover:underline">View all →</Link>
          </div>
          {expiringDocs.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle size={32} className="text-teal mx-auto mb-2" />
              <p className="text-body-brown text-sm">All documents are current. No action needed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringDocs.slice(0, 6).map(doc => {
                const dateStr = doc.gl_expiration_date || doc.expiration_date;
                const diff = dateStr ? Math.ceil((new Date(dateStr) - now) / 86400000) : null;
                const v = vendorMap[doc.vendor_id];
                return (
                  <div key={doc.id} className="flex items-start justify-between py-2 border-b border-sand last:border-0 gap-2">
                    <div className="min-w-0">
                      <p className="text-navy text-sm font-medium truncate">{v?.business_name || "Unknown Vendor"}</p>
                      <p className="text-body-brown text-xs capitalize">{doc.document_type?.replace(/_/g, " ")} · {diff !== null ? `${diff}d left` : "Date missing"}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ComplianceBadge status="expiring_soon" />
                      <button onClick={() => handleReRequest(doc)} className="text-xs text-teal-dark font-semibold hover:underline flex items-center gap-1">
                        <Mail size={11} /> Re-Request
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Applications */}
        <div className="bg-white rounded-2xl border border-sand-dark p-6">
          <h3 className="text-navy font-bold mb-4">Pending Vendor Applications ({pendingApps.length})</h3>
          {pendingApps.length === 0 ? (
            <p className="text-body-brown text-sm py-4 text-center">No pending applications.</p>
          ) : (
            <div className="space-y-3">
              {pendingApps.map(av => {
                const v = vendorMap[av.vendor_id];
                return (
                  <div key={av.id} className="py-2 border-b border-sand last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-navy text-sm font-semibold">{v?.business_name || `Vendor ${av.vendor_id?.substring(0, 8)}`}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(av)}
                          disabled={actionLoading}
                          className="text-xs bg-teal text-navy font-bold px-3 py-1.5 rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-60"
                        >Approve</button>
                        <button
                          onClick={() => { setRejectModal(av); setRejectReason(""); }}
                          disabled={actionLoading}
                          className="text-xs bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
                        >Reject</button>
                      </div>
                    </div>
                    {v?.trade_categories?.length > 0 && (
                      <p className="text-body-brown text-xs">{v.trade_categories.slice(0, 2).join(", ")}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Resident Management */}
      <div className="bg-white rounded-2xl border border-sand-dark p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-navy font-bold">Resident Management</h3>
          <span className="text-body-brown text-sm">{residents.length} registered</span>
        </div>
        <div className="mb-4">
          <label className="block text-navy font-medium text-sm mb-1.5">Resident signup link</label>
          <div className="flex gap-2">
            <input readOnly value={association?.resident_signup_link || ""} className="flex-1 border border-sand-dark rounded-lg px-4 py-2.5 text-body-brown text-sm bg-sand" />
            <button type="button" onClick={() => { navigator.clipboard.writeText(association?.resident_signup_link || ""); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 bg-navy text-white px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-navy-mid transition-colors">
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>
        </div>
        {residents.length > 0 ? (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {residents.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-sand last:border-0">
                <span className="text-navy font-medium">{r.first_name} {r.last_name}</span>
                <span className="text-body-brown text-xs">Unit {r.unit_number} · {r.resident_type}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-brown text-sm">No residents registered yet. Share the signup link above to invite them.</p>
        )}
      </div>

      {/* Resident Invite Modal */}
      {residentModal && (
        <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-navy font-bold">Invite Residents</h3>
              <button onClick={() => setResidentModal(false)}><X size={18} className="text-body-brown" /></button>
            </div>
            <p className="text-body-brown text-sm mb-4">Share this link with your residents so they can sign up and access the approved vendor directory.</p>
            <div className="flex gap-2 mb-4">
              <input readOnly value={association?.resident_signup_link || ""} className="flex-1 border border-sand-dark rounded-lg px-4 py-2.5 text-body-brown text-sm bg-sand" />
              <button onClick={() => { navigator.clipboard.writeText(association?.resident_signup_link || ""); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1.5 bg-navy text-white px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-navy-mid transition-colors">
                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <button onClick={() => setResidentModal(false)} className="w-full border border-sand-dark text-navy font-medium py-2.5 rounded-xl text-sm hover:bg-sand transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-navy font-bold">Reject Application</h3>
              <button onClick={() => setRejectModal(null)}><X size={18} className="text-body-brown" /></button>
            </div>
            <p className="text-body-brown text-sm mb-3">Optionally provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none h-24 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 border border-sand-dark text-navy font-medium py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-600 disabled:opacity-60">
                {actionLoading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AssociationLayout>
  );
}