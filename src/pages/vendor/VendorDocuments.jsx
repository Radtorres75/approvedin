import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";
import { computeDocStatus } from "@/lib/constants";
import ComplianceBadge from "@/lib/complianceBadge";
import { Eye, Download, RefreshCw, Trash2, Upload, X, ChevronDown } from "lucide-react";

const NAV = [
  { path: "/portal/vendor", label: "Dashboard" },
  { path: "/portal/vendor/documents", label: "Documents" },
  { path: "/portal/vendor/associations", label: "Associations" },
  { path: "/portal/vendor/profile", label: "Profile" },
  { path: "/portal/vendor/settings", label: "Settings" },
];

export default function VendorDocuments() {
  const { loading: authLoading, user } = useRoleGuard("vendor");
  const [vendor, setVendor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [replaceDoc, setReplaceDoc] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    const allDocs = await base44.entities.ComplianceDocument.filter({ vendor_id: v.id });
    const active = allDocs.filter(d => !d.is_archived).sort((a, b) => {
      const da = a.gl_expiration_date || a.expiration_date || "9999";
      const db = b.gl_expiration_date || b.expiration_date || "9999";
      return da.localeCompare(db);
    });
    const arch = allDocs.filter(d => d.is_archived);
    setDocuments(active);
    setArchived(arch);
    setLoading(false);
  };

  const handleRemove = async (doc) => {
    if (!confirm(`Are you sure you want to remove this document? This cannot be undone.`)) return;
    await base44.entities.ComplianceDocument.update(doc.id, { is_archived: true, archived_date: new Date().toISOString().split("T")[0] });
    await base44.functions.invoke("recalculateProfileCompletion", { vendor_id: vendor.id });
    loadData();
  };

  const handleReplace = async () => {
    if (!replaceFile) return;
    if (!confirm(`You already have a ${replaceDoc.document_type?.replace(/_/g, " ")} on file. Uploading this will replace it and archive the previous version. Continue?`)) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: replaceFile });
    await base44.entities.ComplianceDocument.update(replaceDoc.id, {
      is_archived: true,
      archived_date: new Date().toISOString().split("T")[0],
    });
    await base44.entities.ComplianceDocument.create({
      vendor_id: vendor.id,
      document_type: replaceDoc.document_type,
      file_url,
      file_name: replaceFile.name,
      upload_date: new Date().toISOString().split("T")[0],
      status: "pending_review",
      is_archived: false,
      version_number: (replaceDoc.version_number || 1) + 1,
      gl_expiration_date: replaceDoc.gl_expiration_date,
      workers_comp_option: replaceDoc.workers_comp_option,
    });
    setReplaceDoc(null);
    setReplaceFile(null);
    setUploading(false);
    await base44.functions.invoke("recalculateProfileCompletion", { vendor_id: vendor.id });
    loadData();
  };

  const renderCOIBadges = (doc) => (
    <div className="flex flex-wrap gap-1 mt-1">
      <span className="text-xs text-body-brown">GL:</span>
      <ComplianceBadge status={computeDocStatus(doc.gl_expiration_date)} />
      {doc.auto_do_not_carry ? <ComplianceBadge status="not_carried" /> : doc.auto_hold_harmless ? <ComplianceBadge status="hold_harmless" /> : <ComplianceBadge status={computeDocStatus(doc.auto_expiration_date)} />}
      {doc.umbrella_do_not_carry ? <ComplianceBadge status="not_carried" /> : doc.umbrella_hold_harmless ? <ComplianceBadge status="hold_harmless" /> : <ComplianceBadge status={computeDocStatus(doc.umbrella_expiration_date)} />}
    </div>
  );

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Vendor" userRole="vendor">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-navy mb-6">My Documents</h1>

        {documents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sand-dark p-12 text-center">
            <p className="text-body-brown text-sm mb-2">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map(doc => {
              const expDate = doc.gl_expiration_date || doc.expiration_date;
              const status = doc.document_type === "coi" ? computeDocStatus(doc.gl_expiration_date) : computeDocStatus(expDate);
              return (
                <div key={doc.id} className="bg-white rounded-2xl border border-sand-dark p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-navy font-bold capitalize">{doc.document_type?.replace(/_/g, " ")}</h3>
                        <ComplianceBadge status={status} />
                        {doc.workers_comp_option === "hold_harmless" && <ComplianceBadge status="hold_harmless" />}
                        {doc.workers_comp_option === "do_not_carry" && <ComplianceBadge status="not_carried" />}
                      </div>
                      {doc.document_type === "coi" && renderCOIBadges(doc)}
                      <p className="text-body-brown text-xs mt-1">
                        {doc.document_type === "sunbiz" ? "Annual renewal due May 1 each year." : expDate ? `Expires ${expDate}` : ""}
                        {doc.license_number && ` · License: ${doc.license_number}`}
                      </p>
                      <p className="text-body-brown text-xs">Version {doc.version_number} · Uploaded {doc.upload_date}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => setPreviewUrl(doc.file_url)} className="flex items-center gap-1.5 text-xs text-body-brown hover:text-navy border border-sand-dark px-3 py-1.5 rounded-lg hover:bg-sand transition-colors">
                        <Eye size={12} /> Preview
                      </button>
                      <a href={doc.file_url} download className="flex items-center gap-1.5 text-xs text-body-brown hover:text-navy border border-sand-dark px-3 py-1.5 rounded-lg hover:bg-sand transition-colors">
                        <Download size={12} /> Download
                      </a>
                      <button onClick={() => setReplaceDoc(doc)} className="flex items-center gap-1.5 text-xs text-teal-dark border border-teal/30 bg-teal/5 px-3 py-1.5 rounded-lg hover:bg-teal/10 transition-colors">
                        <RefreshCw size={12} /> Replace
                      </button>
                      <button onClick={() => handleRemove(doc)} className="flex items-center gap-1.5 text-xs text-red-500 border border-red-100 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Archived */}
        {archived.length > 0 && (
          <div className="mt-8">
            <button onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-2 text-body-brown text-sm font-semibold hover:text-navy transition-colors">
              <ChevronDown size={14} className={`transition-transform ${showArchived ? "rotate-180" : ""}`} />
              Show Archived ({archived.length})
            </button>
            {showArchived && (
              <div className="mt-3 space-y-3">
                {archived.map(doc => (
                  <div key={doc.id} className="bg-sand rounded-xl border border-sand-dark p-4 opacity-70">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-navy text-sm font-medium capitalize">{doc.document_type?.replace(/_/g, " ")}</p>
                        <p className="text-body-brown text-xs">Archived {doc.archived_date} · Version {doc.version_number}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setPreviewUrl(doc.file_url)} className="text-xs text-body-brown hover:text-navy border border-sand-dark px-2 py-1 rounded-lg"><Eye size={12} /></button>
                        <a href={doc.file_url} download className="text-xs text-body-brown hover:text-navy border border-sand-dark px-2 py-1 rounded-lg"><Download size={12} /></a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-navy/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[80vh] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-sand">
              <span className="font-bold text-navy">Document Preview</span>
              <div className="flex gap-2">
                <a href={previewUrl} download className="text-xs bg-teal text-navy font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><Download size={12} /> Download</a>
                <button onClick={() => setPreviewUrl(null)} className="text-body-brown hover:text-navy px-2">✕</button>
              </div>
            </div>
            <iframe src={previewUrl} className="w-full h-[60vh]" title="Document preview" />
          </div>
        </div>
      )}

      {/* Replace Modal */}
      {replaceDoc && (
        <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-navy font-bold">Replace Document</h3>
              <button onClick={() => { setReplaceDoc(null); setReplaceFile(null); }} className="text-body-brown"><X size={18} /></button>
            </div>
            <div className="border-2 border-dashed border-sand-dark rounded-xl p-4 mb-4">
              {replaceFile ? (
                <div className="flex items-center justify-between">
                  <span className="text-navy text-sm font-medium">{replaceFile.name}</span>
                  <button onClick={() => setReplaceFile(null)} className="text-body-brown"><X size={14} /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer">
                  <Upload size={20} className="text-body-brown" />
                  <span className="text-body-brown text-sm">Click to upload new file</span>
                  <input type="file" onChange={e => setReplaceFile(e.target.files[0])} className="sr-only" />
                </label>
              )}
            </div>
            <button onClick={handleReplace} disabled={!replaceFile || uploading} className="w-full bg-navy text-white font-bold py-3 rounded-xl text-sm hover:bg-navy-mid transition-colors disabled:opacity-60">
              {uploading ? "Uploading..." : "Replace Document"}
            </button>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}