import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";
import { FLORIDA_COUNTIES, ASSOCIATION_TYPES } from "@/lib/constants";
import { Copy, Check } from "lucide-react";

const NAV = [
  { path: "/portal/association", label: "Dashboard" },
  { path: "/portal/association/vendors", label: "Vendors" },
  { path: "/portal/association/documents", label: "Documents" },
  { path: "/portal/association/settings", label: "Settings" },
];

export default function AssociationSettings() {
  const { loading: authLoading, user } = useRoleGuard("association_manager");
  const [assoc, setAssoc] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [residents, setResidents] = useState([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const assocs = await base44.entities.Association.list();
    const a = assocs.find(x => x.user_id === user.id) || assocs[0];
    setAssoc(a);
    setForm(a || {});
    if (a) {
      const res = await base44.entities.Resident.filter({ association_id: a.id });
      setResidents(res);
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Association.update(assoc.id, {
      ...form,
      number_of_units: parseInt(form.number_of_units) || assoc.number_of_units,
      gl_minimum_coverage: form.gl_minimum_coverage ? parseFloat(form.gl_minimum_coverage) : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(assoc?.resident_signup_link || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Association" userRole="association_manager">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-navy mb-8">Association Settings</h1>
        <form onSubmit={handleSave} className="space-y-8">

          {/* General Info */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-4">
            <h2 className="text-navy font-bold text-base mb-4">General Information</h2>
            <Field label="Association name *" value={form.association_name || ""} onChange={v => setForm({...form, association_name: v})} required />
            <SelectField label="Association type" value={form.association_type || ""} onChange={v => setForm({...form, association_type: v})} options={ASSOCIATION_TYPES} />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Florida county" value={form.florida_county || ""} onChange={v => setForm({...form, florida_county: v})} options={FLORIDA_COUNTIES} />
              <Field label="City" value={form.city || ""} onChange={v => setForm({...form, city: v})} />
            </div>
            <Field label="Street address" value={form.street_address || ""} onChange={v => setForm({...form, street_address: v})} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="ZIP code" value={form.zip_code || ""} onChange={v => setForm({...form, zip_code: v})} />
              <Field label="Phone number" value={form.phone_number || ""} onChange={v => setForm({...form, phone_number: v})} />
            </div>
            <Field label="Number of units" type="number" value={form.number_of_units || ""} onChange={v => setForm({...form, number_of_units: v})} />
            <Field label="Management company name (optional)" value={form.management_company_name || ""} onChange={v => setForm({...form, management_company_name: v})} />
          </div>

          {/* Compliance Requirements */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-4">
            <h2 className="text-navy font-bold text-base mb-4">Compliance Requirements</h2>
            {[
              { key: "require_coi", label: "Certificate of Insurance (COI)" },
              { key: "require_trade_license", label: "Trade License" },
              { key: "require_workers_comp", label: "Workers Compensation" },
              { key: "require_sunbiz", label: "Florida Sunbiz Corporate Standing" },
            ].map(r => (
              <label key={r.key} className="flex items-center justify-between p-3 bg-cream rounded-xl border border-sand-dark cursor-pointer">
                <span className="text-navy font-medium text-sm">{r.label}</span>
                <input type="checkbox" checked={!!form[r.key]} onChange={e => setForm({...form, [r.key]: e.target.checked})} className="accent-teal w-4 h-4" />
              </label>
            ))}
            <Field label="Minimum GL Coverage ($)" type="number" value={form.gl_minimum_coverage || ""} onChange={v => setForm({...form, gl_minimum_coverage: v})} placeholder="e.g. 1000000" />
            <label className="flex items-center justify-between p-3 bg-cream rounded-xl border border-sand-dark cursor-pointer">
              <div>
                <span className="text-navy font-medium text-sm block">Auto-approve compliant vendors</span>
                <span className="text-body-brown text-xs">Automatically approve vendors when all required documents are current</span>
              </div>
              <input type="checkbox" checked={!!form.auto_approve_if_compliant} onChange={e => setForm({...form, auto_approve_if_compliant: e.target.checked})} className="accent-teal w-4 h-4" />
            </label>
            <div>
              <label className="block text-navy font-medium text-sm mb-1.5">Custom compliance notes (shown to vendors)</label>
              <textarea value={form.custom_compliance_notes || ""} onChange={e => setForm({...form, custom_compliance_notes: e.target.value})} className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none h-24" />
            </div>
          </div>

          {/* Resident Management */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6">
            <h2 className="text-navy font-bold text-base mb-4">Resident Management</h2>
            <div className="mb-4">
              <label className="block text-navy font-medium text-sm mb-1.5">Resident signup link</label>
              <div className="flex gap-2">
                <input readOnly value={assoc?.resident_signup_link || ""} className="flex-1 border border-sand-dark rounded-lg px-4 py-2.5 text-body-brown text-sm bg-sand" />
                <button type="button" onClick={copyLink} className="flex items-center gap-1.5 bg-navy text-white px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-navy-mid transition-colors">
                  {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            </div>
            <p className="text-body-brown text-sm mb-3">Registered residents ({residents.length})</p>
            {residents.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {residents.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-sand last:border-0">
                    <span className="text-navy font-medium">{r.first_name} {r.last_name}</span>
                    <span className="text-body-brown text-xs">Unit {r.unit_number} · {r.resident_type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={saving} className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </form>
      </div>
    </PortalLayout>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }) {
  return (
    <div>
      <label className="block text-navy font-medium text-sm mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-navy font-medium text-sm mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}