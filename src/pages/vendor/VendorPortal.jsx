import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";
import { computeDocStatus, computeProfileCompletion } from "@/lib/constants";
import ComplianceBadge from "@/lib/complianceBadge";
import { CheckCircle, Circle, AlertTriangle, Clock } from "lucide-react";

const NAV = [
  { path: "/portal/vendor", label: "Dashboard" },
  { path: "/portal/vendor/documents", label: "Documents" },
  { path: "/portal/vendor/associations", label: "Associations" },
  { path: "/portal/vendor/profile", label: "Profile" },
  { path: "/portal/vendor/settings", label: "Settings" },
];

export default function VendorPortal() {
  const { loading: authLoading, user } = useRoleGuard("vendor");
  const [vendor, setVendor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const vendors = await base44.entities.Vendor.filter({ user_id: user.id });
    const v = vendors[0];
    if (!v) { navigate("/portal/vendor/setup"); return; }

    if (!v.setup_highest_completed_step || v.setup_highest_completed_step < 7) {
      navigate("/portal/vendor/setup");
      return;
    }

    const docs = await base44.entities.ComplianceDocument.filter({ vendor_id: v.id, is_archived: false });
    const pct = computeProfileCompletion(v, docs);
    if (pct !== v.profile_completion_percentage) {
      await base44.entities.Vendor.update(v.id, { profile_completion_percentage: pct });
      v.profile_completion_percentage = pct;
    }
    setVendor(v);
    setDocuments(docs);

    const conns = await base44.entities.AssociationVendor.filter({ vendor_id: v.id });
    setConnections(conns);
    setLoading(false);
  };

  const getBetaDaysRemaining = () => {
    if (!vendor?.beta_signup_date) return null;
    const expDate = new Date(vendor.beta_signup_date);
    expDate.setMonth(expDate.getMonth() + 6);
    const diff = Math.ceil((expDate - new Date()) / 86400000);
    return diff;
  };

  const todoItems = [
    { label: "Business name", done: !!vendor?.business_name, link: "/portal/vendor/profile" },
    { label: "Business phone", done: !!vendor?.business_phone, link: "/portal/vendor/profile" },
    { label: "Business email", done: !!vendor?.business_email, link: "/portal/vendor/profile" },
    { label: "Business description", done: !!vendor?.business_description, link: "/portal/vendor/profile" },
    { label: "Trade categories", done: !!(vendor?.trade_categories?.length > 0), link: "/portal/vendor/profile" },
    { label: "Florida counties served", done: !!(vendor?.florida_counties_served?.length > 0), link: "/portal/vendor/profile" },
    { label: "COI uploaded with GL expiration", done: !!(documents.find(d => d.document_type === "coi" && d.gl_expiration_date)), link: "/portal/vendor/documents" },
    { label: "Trade license uploaded", done: !!(documents.find(d => d.document_type === "trade_license" && d.expiration_date)), link: "/portal/vendor/documents" },
    { label: "Workers compensation on file", done: !!(documents.find(d => d.document_type === "workers_comp")), link: "/portal/vendor/documents" },
    { label: "Florida Sunbiz uploaded", done: !!(documents.find(d => d.document_type === "sunbiz" && d.file_url)), link: "/portal/vendor/documents" },
  ];

  const pct = computeProfileCompletion(vendor, documents);
  const betaDays = getBetaDaysRemaining();
  const sortedDocs = [...documents].sort((a, b) => {
    const da = a.gl_expiration_date || a.expiration_date || "9999";
    const db = b.gl_expiration_date || b.expiration_date || "9999";
    return da.localeCompare(db);
  });

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Vendor" userRole="vendor">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-navy">{vendor?.business_name || "Vendor Dashboard"}</h1>
            <p className="text-body-brown text-sm mt-0.5">{vendor?.trade_categories?.slice(0, 2).join(", ")}</p>
          </div>
          {betaDays !== null && betaDays > 0 && (
            <div className="bg-teal/10 border border-teal/20 rounded-xl px-4 py-2 text-sm">
              <span className="text-teal-dark font-semibold">Beta access active</span>
              <span className="text-body-brown ml-2">— {betaDays} days remaining</span>
            </div>
          )}
        </div>

        {/* Profile Completion */}
        <div className="bg-white rounded-2xl border border-sand-dark p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-navy font-bold text-base">Profile Completion</h2>
            <span className="text-2xl font-black text-teal">{pct}%</span>
          </div>
          <div className="h-3 bg-sand-dark rounded-full overflow-hidden mb-4">
            <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {pct < 100 && (
            <div className="space-y-2">
              <p className="text-body-brown text-xs font-semibold uppercase tracking-wider">To-do to reach 100%</p>
              {todoItems.filter(t => !t.done).map(item => (
                <Link key={item.label} to={item.link} className="flex items-center gap-2 text-sm text-navy hover:text-teal-dark transition-colors">
                  <Circle size={14} className="text-sand-dark flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
          {pct === 100 && (
            <div className="flex items-center gap-2 text-teal-dark text-sm font-semibold">
              <CheckCircle size={16} /> Profile complete — you're eligible for all associations
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Documents */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-navy font-bold text-base">Document Status</h2>
              <Link to="/portal/vendor/documents" className="text-teal-dark text-xs font-semibold hover:underline">View all →</Link>
            </div>
            {sortedDocs.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-body-brown text-sm mb-2">No documents uploaded.</p>
                <Link to="/portal/vendor/documents" className="text-teal-dark text-sm font-semibold hover:underline">Upload documents →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedDocs.map(doc => {
                  const expDate = doc.gl_expiration_date || doc.expiration_date;
                  const status = computeDocStatus(expDate);
                  return (
                    <div key={doc.id} className="flex items-center justify-between py-2 border-b border-sand last:border-0">
                      <div>
                        <p className="text-navy text-sm font-medium capitalize">{doc.document_type?.replace(/_/g, " ")}</p>
                        {expDate && <p className="text-body-brown text-xs">Expires {expDate}</p>}
                      </div>
                      <ComplianceBadge status={status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Connections */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-navy font-bold text-base">Association Connections</h2>
              <Link to="/portal/vendor/associations" className="text-teal-dark text-xs font-semibold hover:underline">Browse all →</Link>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Approved", count: connections.filter(c => c.status === "approved").length, color: "text-teal-dark" },
                { label: "Pending", count: connections.filter(c => c.status === "pending").length, color: "text-amber-600" },
                { label: "Rejected", count: connections.filter(c => c.status === "rejected").length, color: "text-red-500" },
              ].map(s => (
                <div key={s.label} className="text-center bg-cream rounded-xl p-3">
                  <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
                  <div className="text-body-brown text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {connections.length === 0 && (
              <p className="text-body-brown text-sm text-center">
                No connections yet. <Link to="/portal/vendor/associations" className="text-teal-dark font-semibold hover:underline">Apply to associations →</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}