import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";
import { computeDocStatus } from "@/lib/constants";
import ComplianceBadge from "@/lib/complianceBadge";
import { AlertTriangle, Users, FileCheck, Clock, TrendingUp, Mail } from "lucide-react";

const NAV = [
  { path: "/portal/association", label: "Dashboard" },
  { path: "/portal/association/vendors", label: "Vendors" },
  { path: "/portal/association/documents", label: "Documents" },
  { path: "/portal/association/settings", label: "Settings" },
];

export default function AssociationPortal() {
  const { loading: authLoading, user } = useRoleGuard("association_manager");
  const [data, setData] = useState({ assoc: null, assocVendors: [], documents: [], applications: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    // Filter by created_by (email) since that's what the RLS uses
    const assocs = await base44.entities.Association.list();
    const assoc = assocs.find(a => a.user_id === user.id) || assocs[0];
    if (!assoc) { navigate("/onboarding"); return; }
    if (!assoc.onboarding_complete) { navigate("/onboarding"); return; }

    const assocVendors = await base44.entities.AssociationVendor.filter({ association_id: assoc.id });
    const applications = await base44.entities.VendorApplication.filter({ association_id: assoc.id, status: "submitted" });

    const vendorIds = [...new Set(assocVendors.map(av => av.vendor_id))];
    let allDocs = [];
    for (const vid of vendorIds) {
      const docs = await base44.entities.ComplianceDocument.filter({ vendor_id: vid, is_archived: false });
      allDocs = [...allDocs, ...docs];
    }

    setData({ assoc, assocVendors, documents: allDocs, applications });
    setLoading(false);
  };

  const approvedVendors = data.assocVendors.filter(av => av.status === "approved");
  const now = new Date();
  const in90 = new Date(now); in90.setDate(now.getDate() + 90);
  const expiringDocs = data.documents.filter(d => {
    const dates = [d.gl_expiration_date, d.auto_expiration_date, d.umbrella_expiration_date, d.professional_expiration_date, d.expiration_date].filter(Boolean);
    return dates.some(date => { const exp = new Date(date); return exp > now && exp <= in90; });
  });
  const expiredDocs = data.documents.filter(d => {
    const status = computeDocStatus(d.gl_expiration_date || d.expiration_date);
    return status === "expired";
  });
  const urgentDocs = data.documents.filter(d => {
    const dates = [d.gl_expiration_date, d.auto_expiration_date, d.umbrella_expiration_date, d.professional_expiration_date, d.expiration_date].filter(Boolean);
    return dates.some(date => { const exp = new Date(date); const diff = Math.ceil((exp - now) / 86400000); return diff >= 0 && diff <= 7; });
  });

  const handleApprove = async (app) => {
    await base44.entities.VendorApplication.update(app.id, { status: "approved", reviewed_date: new Date().toISOString().split("T")[0] });
    const av = data.assocVendors.find(av => av.vendor_id === app.vendor_id);
    if (av) await base44.entities.AssociationVendor.update(av.id, { status: "approved", approved_date: new Date().toISOString().split("T")[0], is_visible_in_resident_directory: true });
    await base44.entities.Notification.create({
      user_id: app.vendor_id,
      notification_type: "vendor_approved",
      title: "Application approved",
      message: `Your application to join ${data.assoc?.association_name} has been approved. You are now listed in their approved vendor directory.`,
      action_url: "/portal/vendor/associations",
      is_read: false,
    });
    loadData();
  };

  const handleReject = async (app) => {
    await base44.entities.VendorApplication.update(app.id, { status: "rejected", reviewed_date: new Date().toISOString().split("T")[0] });
    const av = data.assocVendors.find(av => av.vendor_id === app.vendor_id);
    if (av) await base44.entities.AssociationVendor.update(av.id, { status: "rejected", rejected_date: new Date().toISOString().split("T")[0] });
    loadData();
  };

  const handleReRequest = async (doc) => {
    const vendors = await base44.entities.Vendor.filter({ id: doc.vendor_id });
    const vendor = vendors[0];
    if (!vendor) return alert("Vendor not found.");
    const users = await base44.entities.User.filter({ id: vendor.user_id });
    const vUser = users[0];
    if (!vUser) return alert("User not found.");
    try {
      await base44.integrations.Core.SendEmail({
        to: vUser.email,
        subject: `Document renewal requested by ${data.assoc?.association_name}`,
        body: `${data.assoc?.association_name} is requesting you renew your ${doc.document_type.replace(/_/g, " ")} document. Please log in to your ApprovedIn vendor portal to upload the updated document: ${window.location.origin}/portal/vendor/documents`,
      });
      alert("Re-request sent successfully.");
    } catch {
      alert("Failed to send re-request. Please try again.");
    }
  };

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Association" userRole="association_manager">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-navy">{data.assoc?.association_name}</h1>
          <p className="text-body-brown text-sm">{data.assoc?.city}, {data.assoc?.florida_county} County</p>
        </div>

        {/* Urgent Banner */}
        {urgentDocs.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm font-semibold">
              {urgentDocs.length} vendor document{urgentDocs.length > 1 ? "s" : ""} expire{urgentDocs.length === 1 ? "s" : ""} within 7 days — immediate action required.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Approved Vendors", value: approvedVendors.length, icon: <Users size={18} className="text-teal" /> },
            { label: "Expiring Soon", value: expiringDocs.length, icon: <Clock size={18} className="text-amber-500" /> },
            { label: "Expired", value: expiredDocs.length, icon: <AlertTriangle size={18} className="text-red-500" /> },
            { label: "Documents on File", value: data.documents.length, icon: <FileCheck size={18} className="text-teal" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-sand-dark">
              <div className="flex items-center justify-between mb-2">{s.icon}<span className="text-2xl font-black text-navy">{s.value}</span></div>
              <p className="text-body-brown text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expiring Docs */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <h2 className="text-navy font-bold text-base mb-4">Expiring Documents (90 days)</h2>
            {expiringDocs.length === 0 ? (
              <p className="text-body-brown text-sm py-4 text-center">No documents expiring in the next 90 days.</p>
            ) : (
              <div className="space-y-3">
                {expiringDocs.slice(0, 5).map(doc => {
                  const dateStr = doc.gl_expiration_date || doc.expiration_date;
                  const diff = dateStr ? Math.ceil((new Date(dateStr) - now) / 86400000) : null;
                  return (
                    <div key={doc.id} className="flex items-center justify-between py-2 border-b border-sand last:border-0">
                      <div>
                        <p className="text-navy text-sm font-medium">{doc.document_type?.replace(/_/g, " ").toUpperCase()}</p>
                        <p className="text-body-brown text-xs">{diff !== null ? `${diff} days remaining` : "Date missing"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ComplianceBadge status="expiring_soon" />
                        <button onClick={() => handleReRequest(doc)} className="text-xs text-teal-dark font-semibold hover:underline flex items-center gap-1">
                          <Mail size={12} /> Re-Request
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
            <h2 className="text-navy font-bold text-base mb-4">Pending Applications ({data.applications.length})</h2>
            {data.applications.length === 0 ? (
              <p className="text-body-brown text-sm py-4 text-center">No pending vendor applications.</p>
            ) : (
              <div className="space-y-3">
                {data.applications.map(app => (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b border-sand last:border-0">
                    <div>
                      <p className="text-navy text-sm font-medium">Vendor ID: {app.vendor_id?.substring(0, 8)}...</p>
                      <p className="text-body-brown text-xs">{app.applied_date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(app)} className="text-xs bg-teal text-navy font-bold px-3 py-1.5 rounded-lg hover:bg-teal-dark transition-colors">Approve</button>
                      <button onClick={() => handleReject(app)} className="text-xs bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}