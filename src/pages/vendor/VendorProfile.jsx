import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";
import { FLORIDA_COUNTIES, TRADE_CATEGORIES } from "@/lib/constants";
import { Upload, X } from "lucide-react";

const NAV = [
  { path: "/portal/vendor", label: "Dashboard" },
  { path: "/portal/vendor/documents", label: "Documents" },
  { path: "/portal/vendor/associations", label: "Associations" },
  { path: "/portal/vendor/profile", label: "Profile" },
  { path: "/portal/vendor/settings", label: "Settings" },
];

export default function VendorProfile() {
  const { loading: authLoading, user } = useRoleGuard("vendor");
  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const vendors = await base44.entities.Vendor.filter({ user_id: user.id });
    const v = vendors[0];
    setVendor(v);
    setForm(v || {});
    setLoading(false);
  };

  const toggleMulti = (arr, val) => (arr || []).includes(val) ? (arr || []).filter(x => x !== val) : [...(arr || []), val];

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    let logoUrl = form.logo_url;
    if (logoFile) {
      const res = await base44.integrations.Core.UploadFile({ file: logoFile });
      logoUrl = res.file_url;
    }
    await base44.entities.Vendor.update(vendor.id, {
      ...form,
      logo_url: logoUrl,
      years_in_business: form.years_in_business ? parseInt(form.years_in_business) : null,
    });
    await base44.functions.invoke("recalculateProfileCompletion", { vendor_id: vendor.id });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
    loadData();
  };

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Vendor" userRole="vendor">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-navy mb-8">Business Profile</h1>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-4">
            <h2 className="text-navy font-bold text-base">Business Information</h2>
            <Field label="Business name *" value={form.business_name || ""} onChange={v => setForm({...form, business_name: v})} required />
            <div>
              <label className="block text-navy font-medium text-sm mb-1.5">Business description *</label>
              <textarea value={form.business_description || ""} onChange={e => setForm({...form, business_description: e.target.value})} className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none h-24" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Business phone *" value={form.business_phone || ""} onChange={v => setForm({...form, business_phone: v})} required />
              <Field label="Business email *" type="email" value={form.business_email || ""} onChange={v => setForm({...form, business_email: v})} required />
            </div>
            <Field label="Website (optional)" value={form.business_website || ""} onChange={v => setForm({...form, business_website: v})} />
            <Field label="Years in business" type="number" value={form.years_in_business || ""} onChange={v => setForm({...form, years_in_business: v})} />
          </div>

          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <h2 className="text-navy font-bold text-base mb-4">Logo</h2>
            {(form.logo_url || logoFile) && (
              <img src={logoFile ? URL.createObjectURL(logoFile) : form.logo_url} alt="Logo" className="w-24 h-24 rounded-xl object-cover mb-3 border border-sand-dark" />
            )}
            <label className="flex items-center gap-2 cursor-pointer text-teal-dark text-sm font-medium hover:text-teal transition-colors">
              <Upload size={16} /> Upload new logo
              <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className="sr-only" />
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <h2 className="text-navy font-bold text-base mb-3">Trade Categories</h2>
            <div className="flex flex-wrap gap-2">
              {TRADE_CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => setForm({...form, trade_categories: toggleMulti(form.trade_categories, cat)})}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${(form.trade_categories || []).includes(cat) ? "bg-teal text-navy border-teal" : "bg-white text-body-brown border-sand-dark hover:border-teal/50"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <h2 className="text-navy font-bold text-base mb-3">Florida Counties Served</h2>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {FLORIDA_COUNTIES.map(county => (
                <button key={county} type="button" onClick={() => setForm({...form, florida_counties_served: toggleMulti(form.florida_counties_served, county)})}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${(form.florida_counties_served || []).includes(county) ? "bg-teal text-navy border-teal" : "bg-white text-body-brown border-sand-dark hover:border-teal/50"}`}>
                  {county}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Profile"}
          </button>
        </form>
      </div>
    </PortalLayout>
  );
}

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <div>
      <label className="block text-navy font-medium text-sm mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
    </div>
  );
}