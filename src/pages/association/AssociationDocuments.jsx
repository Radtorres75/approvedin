import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";
import ComplianceBadge from "@/lib/complianceBadge";
import { computeDocStatus } from "@/lib/constants";
import { Search, Eye, Download, Mail } from "lucide-react";

const NAV = [
  { path: "/portal/association", label: "Dashboard" },
  { path: "/portal/association/vendors", label: "Vendors" },
  { path: "/portal/association/documents", label: "Documents" },
  { path: "/portal/association/settings", label: "Settings" },
];

export default function AssociationDocuments() {
  const { loading: authLoading, user } = useRoleGuard("association_manager");
  const [assoc, setAssoc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [vendorMap, setVendorMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const assocs = await base44.entities.Association.list();
    const a = assocs.find(x => x.user_id === user.id) || assocs[0];
    setAssoc(a);
    if (!a) { setLoading(false); return; }

    const avs = await base44.entities.AssociationVendor.filter({ association_id: a.id });
    const vendorData = {};
    let allDocs = [];
    for (const av of avs) {
      const vArr = await base44.entities.Vendor.filter({ id: av.vendor_id });
      if (vArr[0]) vendorData[av.vendor_id] = vArr[0];
      const docs = await base44.entities.ComplianceDocument.filter({ vendor_id: av.vendor_id, is_archived: false });
      allDocs = [...allDocs, ...docs];
    }
    setVendorMap(vendorData);
    setDocuments(allDocs.sort((a, b) => {
      const da = a.gl_expiration_date || a.expiration_date || "9999";
      const db = b.gl_expiration_date || b.expiration_date || "9999";
      return da.localeCompare(db);
    }));
    setLoading(false);
  };

  const handleReRequest = async (doc) => {
    const vendor = vendorMap[doc.vendor_id];
    if (!vendor) return alert("Vendor not found.");
    try {
      const users = await base44.entities.User.filter({ id: vendor.user_id });
      const vUser = users[0];
      await base44.integrations.Core.SendEmail({
        to: vUser?.email || vendor.business_email,
        subject: `Document renewal requested by ${assoc?.association_name}`,
        body: `${assoc?.association_name} is requesting you renew your ${doc.document_type.replace(/_/g, " ")} document. Log in at ${window.location.origin}/portal/vendor/documents`,
      });
      alert("Re-request sent successfully.");
    } catch {
      alert("Failed to send re-request.");
    }
  };

  const filtered = documents.filter(doc => {
    const vendor = vendorMap[doc.vendor_id];
    const status = computeDocStatus(doc.gl_expiration_date || doc.expiration_date);
    const matchTab = tab === "all" || (tab === "active" && status === "active") || (tab === "expiring" && status === "expiring_soon") || (tab === "expired" && status === "expired") || (tab === "pending" && doc.status === "pending_review");
    const matchSearch = !search || vendor?.business_name?.toLowerCase().includes(search.toLowerCase()) || doc.document_type.includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Association" userRole="association_manager">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-navy mb-6">Compliance Document Vault</h1>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-1 bg-white rounded-xl border border-sand-dark p-1 flex-wrap">
            {["all", "active", "expiring", "expired", "pending"].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-navy text-white" : "text-body-brown hover:text-navy"}`}>{t}</button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-body-brown" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by vendor or type..." className="border border-sand-dark rounded-lg pl-8 pr-4 py-2 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sand-dark p-12 text-center">
            <p className="text-body-brown text-sm">No documents found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-sand-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                    const vendor = vendorMap[doc.vendor_id];
                    const expDate = doc.gl_expiration_date || doc.expiration_date;
                    const status = computeDocStatus(expDate);
                    return (
                      <tr key={doc.id} className="hover:bg-cream transition-colors">
                        <td className="px-4 py-3 text-sm text-navy font-medium">{vendor?.business_name || "—"}</td>
                        <td className="px-4 py-3 text-sm text-body-brown capitalize">{doc.document_type?.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-sm text-body-brown">{doc.upload_date || "—"}</td>
                        <td className="px-4 py-3 text-sm text-body-brown">{expDate || "—"}</td>
                        <td className="px-4 py-3"><ComplianceBadge status={status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setPreviewUrl(doc.file_url)} title="Preview" className="text-body-brown hover:text-navy p-1"><Eye size={14} /></button>
                            <a href={doc.file_url} download title="Download" className="text-body-brown hover:text-navy p-1"><Download size={14} /></a>
                            <button onClick={() => handleReRequest(doc)} title="Re-request" className="text-body-brown hover:text-teal-dark p-1"><Mail size={14} /></button>
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
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-navy/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[80vh] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-sand">
              <span className="font-bold text-navy">Document Preview</span>
              <div className="flex gap-2">
                <a href={previewUrl} download className="text-xs bg-teal text-navy font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><Download size={12} /> Download</a>
                <button onClick={() => setPreviewUrl(null)} className="text-body-brown hover:text-navy px-2 py-1">✕</button>
              </div>
            </div>
            <iframe src={previewUrl} className="w-full h-[60vh]" title="Document preview" />
          </div>
        </div>
      )}
    </PortalLayout>
  );
}