import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AssociationLayout from "@/components/layout/AssociationLayout";
import ComplianceBadge from "@/lib/complianceBadge";
import { computeDocStatus } from "@/lib/constants";
import { Search, Eye, Download, Mail, RefreshCw, X } from "lucide-react";

export default function AssociationDocumentVault() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [association, setAssociation] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [vendorMap, setVendorMap] = useState({});
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [reRequestSent, setReRequestSent] = useState({});

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
      const vendorIds = [...new Set(avs.map(av => av.vendor_id))];
      const vMap = {};
      let allDocs = [];
      await Promise.all(vendorIds.map(async vid => {
        const all = await base44.entities.Vendor.list();
        const v = all.find(x => x.id === vid);
        if (v) vMap[vid] = v;
        const docs = await base44.entities.ComplianceDocument.filter({ vendor_id: vid, is_archived: false });
        allDocs.push(...docs);
      }));
      setVendorMap(vMap);
      setDocuments(allDocs.sort((a, b) => {
        const da = a.gl_expiration_date || a.expiration_date || "9999";
        const db = b.gl_expiration_date || b.expiration_date || "9999";
        return da.localeCompare(db);
      }));
    } catch (err) {
      setError("Could not load documents. Please try again.");
    } finally { setLoading(false); }
  };

  const handleReRequest = async (doc) => {
    const v = vendorMap[doc.vendor_id];
    if (!v) return;
    try {
      await base44.integrations.Core.SendEmail({
        to: v.business_email,
        subject: `Document renewal requested by ${association?.association_name}`,
        body: `${association?.association_name} is requesting you renew your ${doc.document_type.replace(/_/g, " ")} document. Log in at ${window.location.origin}/portal/vendor/documents`,
      });
      await base44.entities.Notification.create({
        user_id: v.user_id,
        notification_type: "document_expiring",
        title: "Document renewal requested",
        message: `${association?.association_name} is requesting you renew your ${doc.document_type.replace(/_/g, " ")} document.`,
        action_url: "/portal/vendor/documents",
        is_read: false,
      });
      setReRequestSent(prev => ({ ...prev, [doc.id]: true }));
      setTimeout(() => setReRequestSent(prev => ({ ...prev, [doc.id]: false })), 3000);
    } catch { alert("Failed to send re-request."); }
  };

  const filtered = documents.filter(doc => {
    const status = computeDocStatus(doc.gl_expiration_date || doc.expiration_date);
    const v = vendorMap[doc.vendor_id];
    const matchTab =
      tab === "all" ||
      (tab === "active" && status === "active") ||
      (tab === "expiring" && status === "expiring_soon") ||
      (tab === "expired" && status === "expired") ||
      (tab === "pending" && doc.status === "pending_review");
    const matchSearch = !search ||
      v?.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.document_type?.includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  if (loading) return <AssociationLayout title="Document Vault"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div></AssociationLayout>;
  if (error) return <AssociationLayout title="Document Vault"><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-red-600">{error}</p><button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"><RefreshCw size={14} /> Retry</button></div></AssociationLayout>;

  return (
    <AssociationLayout title="Document Vault">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-navy">Compliance Document Vault</h2>
          <p className="text-body-brown text-sm">{documents.length} document{documents.length !== 1 ? "s" : ""} on file</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-white rounded-xl border border-sand-dark p-1">
          {["all", "active", "expiring", "expired", "pending"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-navy text-white" : "text-body-brown hover:text-navy"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-body-brown" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by vendor or document type..."
            className="border border-sand-dark rounded-lg pl-8 pr-4 py-2 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-dark p-12 text-center">
          <p className="text-body-brown text-sm">No documents found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sand-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-sand text-xs text-body-brown font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Vendor</th>
                  <th className="px-4 py-3 text-left">Document Type</th>
                  <th className="px-4 py-3 text-left">Uploaded</th>
                  <th className="px-4 py-3 text-left">Expiration</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {filtered.map(doc => {
                  const v = vendorMap[doc.vendor_id];
                  const expDate = doc.gl_expiration_date || doc.expiration_date;
                  const status = computeDocStatus(expDate);
                  return (
                    <tr key={doc.id} className="hover:bg-cream transition-colors">
                      <td className="px-4 py-3 text-sm text-navy font-medium">{v?.business_name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-body-brown capitalize">{doc.document_type?.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-sm text-body-brown">{doc.upload_date || "—"}</td>
                      <td className="px-4 py-3 text-sm text-body-brown">{expDate || "—"}</td>
                      <td className="px-4 py-3"><ComplianceBadge status={status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPreviewUrl(doc.file_url)} title="Preview" className="text-body-brown hover:text-navy p-1 rounded"><Eye size={14} /></button>
                          <a href={doc.file_url} download title="Download" className="text-body-brown hover:text-navy p-1 rounded"><Download size={14} /></a>
                          <button onClick={() => handleReRequest(doc)} title="Re-request" className={`p-1 rounded transition-colors ${reRequestSent[doc.id] ? "text-teal" : "text-body-brown hover:text-teal-dark"}`}>
                            <Mail size={14} />
                          </button>
                          {reRequestSent[doc.id] && <span className="text-xs text-teal-dark font-semibold">Sent!</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 bg-navy/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[80vh] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-sand">
              <span className="font-bold text-navy">Document Preview</span>
              <div className="flex gap-2">
                <a href={previewUrl} download className="text-xs bg-teal text-navy font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><Download size={12} /> Download</a>
                <button onClick={() => setPreviewUrl(null)} className="text-body-brown hover:text-navy px-2"><X size={16} /></button>
              </div>
            </div>
            <iframe src={previewUrl} className="w-full h-[60vh]" title="Document preview" />
          </div>
        </div>
      )}
    </AssociationLayout>
  );
}