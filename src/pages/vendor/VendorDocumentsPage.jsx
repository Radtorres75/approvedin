import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VendorLayout from "@/components/layout/VendorLayout";
import ComplianceBadge from "@/lib/complianceBadge";
import { computeDocStatus } from "@/lib/constants";
import { Eye, Download, RefreshCw as RefreshIcon, Trash2, Upload, X, ChevronDown } from "lucide-react";

const DOC_TYPES = [
  { type: "coi", label: "Certificate of Insurance (COI)" },
  { type: "trade_license", label: "Trade License" },
  { type: "workers_comp", label: "Workers Compensation" },
  { type: "sunbiz", label: "Florida Sunbiz Corporate Standing" },
];

export default function VendorDocumentsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [archived, setArchived] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [replaceDoc, setReplaceDoc] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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
      const all = await base44.entities.ComplianceDocument.filter({ vendor_id: v.id });
      setDocuments(all.filter(d => !d.is_archived));
      setArchived(all.filter(d => d.is_archived));
    } catch (err) {
      setError("Could not load documents. Please try again.");
    } finally { setLoading(false); }
  };

  const handleRemove = async (doc) => {
    if (!confirm(`Remove this ${doc.document_type?.replace(/_/g, " ")} document? This cannot be undone.`)) return;
    await base44.entities.ComplianceDocument.update(doc.id, { is_archived: true, archived_date: new Date().toISOString().split("T")[0] });
    await base44.functions.invoke("recalculateProfileCompletion", { vendor_id: vendor.id });
    loadPage();
  };

  const handleReplace = async () => {
    if (!replaceFile || !replaceDoc) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: replaceFile });
    await base44.entities.ComplianceDocument.update(replaceDoc.id, { is_archived: true, archived_date: new Date().toISOString().split("T")[0] });
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
      expiration_date: replaceDoc.expiration_date,
    });
    setReplaceDoc(null); setReplaceFile(null);
    setUploading(false);
    await base44.functions.invoke("recalculateProfileCompletion", { vendor_id: vendor.id });
    loadPage();
  };

  const DocActions = ({ doc }) => (
    <div className="flex flex-wrap gap-2 mt-3">
      <button onClick={() => setPreviewUrl(doc.file_url)} className="flex items-center gap-1.5 text-xs text-body-brown hover:text-navy border border-sand-dark px-3 py-1.5 rounded-lg hover:bg-sand transition-colors">
        <Eye size={12} /> Preview
      </button>
      <a href={doc.file_url} download className="flex items-center gap-1.5 text-xs text-body-brown hover:text-navy border border-sand-dark px-3 py-1.5 rounded-lg hover:bg-sand transition-colors">
        <Download size={12} /> Download
      </a>
      <button onClick={() => { setReplaceDoc(doc); setReplaceFile(null); }} className="flex items-center gap-1.5 text-xs text-teal-dark border border-teal/30 bg-teal/5 px-3 py-1.5 rounded-lg hover:bg-teal/10 transition-colors">
        <RefreshIcon size={12} /> Replace
      </button>
      <button onClick={() => handleRemove(doc)} className="flex items-center gap-1.5 text-xs text-red-500 border border-red-100 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
        <Trash2 size={12} /> Remove
      </button>
    </div>
  );

  if (loading) return <VendorLayout title="My Documents"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div></VendorLayout>;
  if (error) return <VendorLayout title="My Documents"><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-red-600">{error}</p><button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"><RefreshIcon size={14} /> Retry</button></div></VendorLayout>;

  return (
    <VendorLayout title="My Documents">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-navy">My Documents</h2>
          <p className="text-body-brown text-sm">{documents.length} document{documents.length !== 1 ? "s" : ""} on file</p>
        </div>
      </div>

      <div className="space-y-6">
        {DOC_TYPES.map(({ type, label }) => {
          const doc = documents.find(d => d.document_type === type);
          return (
            <div key={type} className="bg-white rounded-2xl border border-sand-dark p-6">
              <h3 className="text-navy font-bold text-base mb-4">{label}</h3>
              {!doc ? (
                <div className="text-center py-4 border-2 border-dashed border-sand-dark rounded-xl">
                  <p className="text-body-brown text-sm mb-2">No {label} uploaded yet.</p>
                  <a href="/portal/vendor/setup" className="text-teal-dark text-sm font-semibold hover:underline">Upload in Setup →</a>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-navy text-sm font-semibold">{doc.file_name || "Document"}</p>
                      <p className="text-body-brown text-xs">Uploaded {doc.upload_date} · Version {doc.version_number}</p>
                    </div>
                  </div>

                  {type === "coi" && (
                    <div className="mt-3 space-y-2 bg-cream rounded-xl p-3">
                      {[
                        { label: "General Liability", exp: doc.gl_expiration_date, dnc: false, hh: false, extra: doc.gl_coverage_limit ? ` — $${doc.gl_coverage_limit.toLocaleString()} coverage` : "" },
                        { label: "Commercial Auto", exp: doc.auto_expiration_date, dnc: doc.auto_do_not_carry, hh: doc.auto_hold_harmless },
                        { label: "Umbrella / Excess", exp: doc.umbrella_expiration_date, dnc: doc.umbrella_do_not_carry, hh: doc.umbrella_hold_harmless },
                        { label: "Professional Liability", exp: doc.professional_expiration_date, dnc: doc.professional_do_not_carry, hh: doc.professional_hold_harmless },
                      ].map(cov => (
                        <div key={cov.label} className="flex items-center justify-between text-sm">
                          <span className="text-body-brown">{cov.label}{cov.extra}</span>
                          {cov.dnc ? <ComplianceBadge status="not_carried" /> :
                           cov.hh ? <ComplianceBadge status="hold_harmless" /> :
                           <div className="flex items-center gap-2">
                             {cov.exp && <span className="text-xs text-body-brown">Exp: {cov.exp}</span>}
                             <ComplianceBadge status={computeDocStatus(cov.exp)} />
                           </div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {type === "trade_license" && (
                    <div className="mt-3 bg-cream rounded-xl p-3 text-sm space-y-1">
                      {doc.license_number && <p className="text-body-brown">License #: <span className="text-navy font-medium">{doc.license_number}</span></p>}
                      {doc.issuing_authority && <p className="text-body-brown">Issued by: <span className="text-navy font-medium">{doc.issuing_authority}</span></p>}
                      <div className="flex items-center gap-2">
                        {doc.expiration_date && <p className="text-body-brown">Expires: <span className="text-navy font-medium">{doc.expiration_date}</span></p>}
                        <ComplianceBadge status={computeDocStatus(doc.expiration_date)} />
                      </div>
                    </div>
                  )}

                  {type === "workers_comp" && (
                    <div className="mt-3 flex items-center gap-2">
                      {doc.workers_comp_option === "hold_harmless" ? <ComplianceBadge status="hold_harmless" /> :
                       doc.workers_comp_option === "do_not_carry" ? <ComplianceBadge status="not_carried" /> :
                       <>
                         {doc.expiration_date && <span className="text-body-brown text-sm">Expires: {doc.expiration_date}</span>}
                         <ComplianceBadge status={computeDocStatus(doc.expiration_date)} />
                       </>}
                    </div>
                  )}

                  {type === "sunbiz" && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-body-brown text-sm">Annual renewal due May 1, {new Date().getFullYear()}</span>
                      <ComplianceBadge status={computeDocStatus(doc.expiration_date)} />
                    </div>
                  )}

                  {doc.file_url && <DocActions doc={doc} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
                      {doc.file_url && <>
                        <button onClick={() => setPreviewUrl(doc.file_url)} className="text-xs text-body-brown hover:text-navy border border-sand-dark px-2 py-1 rounded-lg"><Eye size={12} /></button>
                        <a href={doc.file_url} download className="text-xs text-body-brown hover:text-navy border border-sand-dark px-2 py-1 rounded-lg"><Download size={12} /></a>
                      </>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
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

      {/* Replace Modal */}
      {replaceDoc && (
        <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-navy font-bold">Replace Document</h3>
              <button onClick={() => { setReplaceDoc(null); setReplaceFile(null); }}><X size={18} className="text-body-brown" /></button>
            </div>
            <p className="text-body-brown text-sm mb-4">The previous version will be archived.</p>
            <div className="border-2 border-dashed border-sand-dark rounded-xl p-4 mb-4">
              {replaceFile ? (
                <div className="flex items-center justify-between">
                  <span className="text-navy text-sm font-medium truncate">{replaceFile.name}</span>
                  <button onClick={() => setReplaceFile(null)}><X size={14} className="text-body-brown" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer">
                  <Upload size={20} className="text-body-brown" />
                  <span className="text-body-brown text-sm">Click to upload new file</span>
                  <input type="file" onChange={e => setReplaceFile(e.target.files[0])} className="sr-only" />
                </label>
              )}
            </div>
            <button onClick={handleReplace} disabled={!replaceFile || uploading}
              className="w-full bg-navy text-white font-bold py-3 rounded-xl text-sm hover:bg-navy-mid transition-colors disabled:opacity-60">
              {uploading ? "Uploading..." : "Replace Document"}
            </button>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}