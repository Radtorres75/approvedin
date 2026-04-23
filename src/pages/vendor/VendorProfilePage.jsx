import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VendorLayout from "@/components/layout/VendorLayout";
import { computeProfileCompletion, FLORIDA_COUNTIES, TRADE_CATEGORIES } from "@/lib/constants";
import { Upload, X, RefreshCw } from "lucide-react";

export default function VendorProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      setForm(v);
      const docs = await base44.entities.ComplianceDocument.filter({ vendor_id: v.id, is_archived: false });
      setDocuments(docs);
    } catch (err) {
      setError("Could not load profile. Please try again.");
    } finally { setLoading(false); }
  };

  const toggleMulti = (arr, val) => arr?.includes(val) ? arr.filter(x => x !== val) : [...(arr || []), val];

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    let logoUrl = form.logo_url;
    if (logoFile) {
      const res = await base44.integrations.Core.UploadFile({ file: logoFile });
      logoUrl = res.file_url;
    }
    const updated = { ...form, logo_url: logoUrl, years_in_business: form.years_in_business ? parseInt(form.years_in_business) : null };
    await base44.entities.Vendor.update(vendor.id, updated);
    const pct = computeProfileCompletion(updated, documents);
    await base44.entities.Vendor.update(vendor.id, { profile_completion_percentage: pct });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
    setLogoFile(null);
    loadPage();
  };

  if (loading) return <VendorLayout title="Profile"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div></VendorLayout>;
  if (error) return <VendorLayout title="Profile"><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-red-600">{error}</p><button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"><RefreshCw size={14} /> Retry</button></div></VendorLayout>;

  return (
    <VendorLayout title="Profile">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-black text-navy mb-8">Vendor Profile</h2>
        <form onSubmit={handleSave} className="space-y-8">

          <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-4">
            <h3 className="text-navy font-bold text-base">Business Information</h3>

            {/* Logo */}
            <div>
              <label className="block text-navy font-medium text-sm mb-1.5">Business Logo</label>
              <div className="flex items-center gap-4">
                {(logoFile ? URL.createObjectURL(logoFile) : form.logo_url) && (
                  <img src={logoFile ? URL.createObjectURL(logoFile) : form.logo_url} alt="logo"
                    className="w-16 h-16 rounded-xl object-cover border border-sand-dark" />
                )}
                <div className="border-2 border-dashed border-sand-dark rounded-xl p-3 hover:border-teal/50 transition-colors">
                  {logoFile ? (
                    <div className="flex items-center gap-2">
                      <span className="text-navy text-sm truncate max-w-36">{logoFile.name}</span>
                      <button type="button" onClick={() => setLogoFile(null)}><X size={14} className="text-body-brown" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Upload size={16} className="text-body-brown" />
                      <span className="text-body-brown text-sm">Upload logo</span>
                      <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className="sr-only" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <Field label="Business name *" value={form.business_name} onChange={v => setForm({ ...form, business_name: v })} required />
            <div>
              <label className="block text-navy font-medium text-sm mb-1.5">Business description *</label>
              <textarea value={form.business_description || ""} onChange={e => setForm({ ...form, business_description: e.target.value })} required
                className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none h-24" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Business phone *" value={form.business_phone} onChange={v => setForm({ ...form, business_phone: v })} required />
              <Field label="Business email *" type="email" value={form.business_email} onChange={v => setForm({ ...form, business_email: v })} required />
            </div>
            <Field label="Business website (optional)" value={form.business_website} onChange={v => setForm({ ...form, business_website: v })} />
            <div>
              <label className="block text-navy font-medium text-sm mb-1.5">Years in business (optional)</label>
              <select value={form.years_in_business || ""} onChange={e => setForm({ ...form, years_in_business: e.target.value })}
                className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
                <option value="">Select...</option>
                {[1,2,3,4,5,6,7,8,9,10,15,20,25,30].map(y => <option key={y} value={y}>{y}+ year{y > 1 ? "s" : ""}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-4">
            <h3 className="text-navy font-bold text-base">Trade Categories</h3>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-sand-dark rounded-lg">
              {TRADE_CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => setForm({ ...form, trade_categories: toggleMulti(form.trade_categories, cat) })}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${form.trade_categories?.includes(cat) ? "bg-teal text-navy border-teal" : "bg-white text-body-brown border-sand-dark hover:border-teal/50"}`}>
                  {cat}
                </button>
              ))}
            </div>
            {form.trade_categories?.length > 0 && <p className="text-teal-dark text-xs">{form.trade_categories.length} selected</p>}
          </div>

          <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-4">
            <h3 className="text-navy font-bold text-base">Florida Counties Served</h3>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-sand-dark rounded-lg">
              {FLORIDA_COUNTIES.map(county => (
                <button key={county} type="button" onClick={() => setForm({ ...form, florida_counties_served: toggleMulti(form.florida_counties_served, county) })}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${form.florida_counties_served?.includes(county) ? "bg-teal text-navy border-teal" : "bg-white text-body-brown border-sand-dark hover:border-teal/50"}`}>
                  {county}
                </button>
              ))}
            </div>
            {form.florida_counties_served?.length > 0 && <p className="text-teal-dark text-xs">{form.florida_counties_served.length} counties selected</p>}
          </div>

          <button type="submit" disabled={saving} className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
            {saving ? "Saving..." : saved ? "✓ Profile saved!" : "Save Profile"}
          </button>
        </form>
      </div>
    </VendorLayout>
  );
}

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <div>
      <label className="block text-navy font-medium text-sm mb-1.5">{label}</label>
      <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} required={required}
        className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
    </div>
  );
}