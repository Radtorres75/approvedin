import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VendorLayout from "@/components/layout/VendorLayout";
import ComplianceBadge from "@/lib/complianceBadge";
import { computeDocStatus, computeProfileCompletion } from "@/lib/constants";
import { CheckCircle, Circle, AlertTriangle, RefreshCw, ChevronRight } from "lucide-react";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [connections, setConnections] = useState([]);

  useEffect(() => { loadPage(); }, []);

  const loadPage = async () => {
    try {
      setLoading(true); setError(null);
      const currentUser = await base44.auth.me();
      if (!currentUser) { navigate("/signin"); return; }
      if (currentUser.role !== "vendor") {
        if (currentUser.role === "association_manager") navigate("/portal/association");
        else if (currentUser.role === "resident") navigate("/portal/resident/dashboard");
        else navigate("/signin");
        return;
      }
      const vendors = await base44.entities.Vendor.filter({ user_id: currentUser.id });
      if (!vendors || vendors.length === 0) { navigate("/portal/vendor/setup"); return; }
      const v = vendors[0];
      if (!v.setup_highest_completed_step || v.setup_highest_completed_step < 8) {
        navigate("/portal/vendor/setup"); return;
      }
      setVendor(v);
      const [docs, conns] = await Promise.all([
        base44.entities.ComplianceDocument.filter({ vendor_id: v.id, is_archived: false }),
        base44.entities.AssociationVendor.filter({ vendor_id: v.id }),
      ]);
      setDocuments(docs);
      setConnections(conns);

      const pct = computeProfileCompletion(v, docs);
      if (pct !== v.profile_completion_percentage) {
        await base44.entities.Vendor.update(v.id, { profile_completion_percentage: pct });
        setVendor(prev => ({ ...prev, profile_completion_percentage: pct }));
      }
    } catch (err) {
      setError("Could not load dashboard. Please try again.");
    } finally { setLoading(false); }
  };

  const getBetaDays = () => {
    if (!vendor?.beta_signup_date) return null;
    const exp = new Date(vendor.beta_signup_date);
    exp.setMonth(exp.getMonth() + 6);
    return Math.ceil((exp - new Date()) / 86400000);
  };

  const todoItems = vendor ? [
    { label: "Business name", done: !!vendor.business_name, link: "/portal/vendor/profile" },
    { label: "Business phone", done: !!vendor.business_phone, link: "/portal/vendor/profile" },
    { label: "Business email", done: !!vendor.business_email, link: "/portal/vendor/profile" },
    { label: "Business description", done: !!vendor.business_description, link: "/portal/vendor/profile" },
    { label: "Trade categories", done: !!(vendor.trade_categories?.length > 0), link: "/portal/vendor/profile" },
    { label: "Florida counties served", done: !!(vendor.florida_counties_served?.length > 0), link: "/portal/vendor/profile" },
    { label: "COI with GL expiration", done: !!(documents.find(d => d.document_type === "coi" && d.gl_expiration_date)), link: "/portal/vendor/documents" },
    { label: "Trade license", done: !!(documents.find(d => d.document_type === "trade_license" && d.expiration_date)), link: "/portal/vendor/documents" },
    { label: "Workers compensation", done: !!(documents.find(d => d.document_type === "workers_comp")), link: "/portal/vendor/documents" },
    { label: "Florida Sunbiz", done: !!(documents.find(d => d.document_type === "sunbiz" && d.file_url)), link: "/portal/vendor/documents" },
  ] : [];

  const pct = computeProfileCompletion(vendor, documents);
  const betaDays = getBetaDays();
  const activeDocs = documents.filter(d => computeDocStatus(d.gl_expiration_date || d.expiration_date) === "active");
  const approvedConns = connections.filter(c => c.status === "approved");
  const pendingConns = connections.filter(c => c.status === "pending");

  const overallStatus = documents.length === 0 ? "noncompliant" :
    documents.some(d => computeDocStatus(d.gl_expiration_date || d.expiration_date) === "expired") ? "noncompliant" :
    documents.some(d => computeDocStatus(d.gl_expiration_date || d.expiration_date) === "expiring_soon") ? "expiring_soon" : "active";

  const sortedDocs = [...documents].sort((a, b) => {
    const da = a.gl_expiration_date || a.expiration_date || "9999";
    const db = b.gl_expiration_date || b.expiration_date || "9999";
    const hasDa = !!(a.gl_expiration_date || a.expiration_date);
    const hasDb = !!(b.gl_expiration_date || b.expiration_date);
    if (!hasDa && hasDb) return -1;
    if (hasDa && !hasDb) return 1;
    return da.localeCompare(db);
  });

  if (loading) return <VendorLayout title="Dashboard"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div></VendorLayout>;
  if (error) return <VendorLayout title="Dashboard"><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-red-600">{error}</p><button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"><RefreshCw size={14} /> Retry</button></div></VendorLayout>;

  return (
    <VendorLayout title="Dashboard">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-navy">{vendor?.business_name || "Vendor Dashboard"}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-teal/10 text-teal-dark font-semibold px-2 py-0.5 rounded-full capitalize">{vendor?.subscription_tier || "beta"}</span>
            {betaDays !== null && betaDays > 0 && (
              <span className="text-body-brown text-xs">Beta access active — {betaDays} days remaining</span>
            )}
          </div>
        </div>
      </div>

      {/* Resume setup banner */}
      {vendor?.setup_highest_completed_step && vendor.setup_highest_completed_step < 8 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <p className="text-amber-800 text-sm font-semibold">
            Welcome back. You left off at Step {vendor.setup_highest_completed_step}. Continue to complete your setup.
          </p>
          <Link to="/portal/vendor/setup" className="flex items-center gap-1 text-amber-700 font-bold text-sm hover:underline">
            Continue <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Profile Completion */}
      <div className="bg-white rounded-2xl border border-sand-dark p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-navy font-bold">Profile Completion</h3>
          <span className="text-2xl font-black text-teal">{pct}%</span>
        </div>
        <div className="h-3 bg-sand-dark rounded-full overflow-hidden mb-4">
          <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        {pct < 100 ? (
          <div className="space-y-1.5">
            <p className="text-body-brown text-xs font-semibold uppercase tracking-wider mb-2">Remaining items</p>
            {todoItems.filter(t => !t.done).map(item => (
              <Link key={item.label} to={item.link} className="flex items-center gap-2 text-sm text-navy hover:text-teal-dark transition-colors">
                <Circle size={13} className="text-sand-dark flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-teal-dark text-sm font-semibold">
            <CheckCircle size={16} /> Profile complete — you're eligible for all associations
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Documents", value: activeDocs.length },
          { label: "Approved Connections", value: approvedConns.length },
          { label: "Pending Applications", value: pendingConns.length },
          { label: "Compliance Status", value: null, badge: overallStatus },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-sand-dark">
            {s.badge ? (
              <>
                <div className="mb-2"><ComplianceBadge status={s.badge} /></div>
                <p className="text-body-brown text-xs font-medium">{s.label}</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-black text-navy mb-1">{s.value}</div>
                <p className="text-body-brown text-xs font-medium">{s.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Document Status */}
      <div className="bg-white rounded-2xl border border-sand-dark p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-navy font-bold">Document Status</h3>
          <Link to="/portal/vendor/documents" className="text-teal-dark text-xs font-semibold hover:underline">View all →</Link>
        </div>
        {sortedDocs.length === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle size={28} className="text-amber-400 mx-auto mb-2" />
            <p className="text-body-brown text-sm mb-2">No documents uploaded.</p>
            <Link to="/portal/vendor/documents" className="text-teal-dark text-sm font-semibold hover:underline">Upload documents →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDocs.map(doc => {
              const expDate = doc.gl_expiration_date || doc.expiration_date;
              const status = computeDocStatus(expDate);
              const hasMissingDate = !expDate &&
                doc.workers_comp_option !== "hold_harmless" && doc.workers_comp_option !== "do_not_carry";
              return (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-sand last:border-0">
                  <div>
                    <p className="text-navy text-sm font-medium capitalize">{doc.document_type?.replace(/_/g, " ")}</p>
                    {expDate && <p className="text-body-brown text-xs">Expires {expDate}</p>}
                    {hasMissingDate && <p className="text-amber-600 text-xs font-semibold">⚠ Missing Date</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.workers_comp_option === "hold_harmless" ? <ComplianceBadge status="hold_harmless" /> :
                     doc.workers_comp_option === "do_not_carry" ? <ComplianceBadge status="not_carried" /> :
                     <ComplianceBadge status={hasMissingDate ? "missing" : status} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </VendorLayout>
  );
}