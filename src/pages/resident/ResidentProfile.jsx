import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";

const NAV = [
  { path: "/portal/resident/dashboard", label: "Home" },
  { path: "/portal/resident/vendors", label: "Find Vendors" },
  { path: "/portal/resident/profile", label: "Profile" },
  { path: "/portal/resident/notifications", label: "Notifications" },
];

export default function ResidentProfile() {
  const { loading: authLoading, user } = useRoleGuard("resident");
  const [resident, setResident] = useState(null);
  const [association, setAssociation] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const residents = await base44.entities.Resident.filter({ user_id: user.id });
    const r = residents[0];
    setResident(r);
    setForm({ first_name: r?.first_name || "", last_name: r?.last_name || "", phone_number: r?.phone_number || "", address: r?.address || "" });
    if (r?.association_id) {
      const assocs = await base44.entities.Association.filter({ id: r.association_id });
      setAssociation(assocs[0]);
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Resident.update(resident.id, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Resident" userRole="resident">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-navy mb-8">My Profile</h1>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-4">
            <h2 className="text-navy font-bold text-base">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" value={form.first_name} onChange={v => setForm({...form, first_name: v})} required />
              <Field label="Last name" value={form.last_name} onChange={v => setForm({...form, last_name: v})} required />
            </div>
            <Field label="Phone number" value={form.phone_number} onChange={v => setForm({...form, phone_number: v})} />
            <Field label="Address" value={form.address} onChange={v => setForm({...form, address: v})} />
          </div>

          <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-3">
            <h2 className="text-navy font-bold text-base mb-2">Account Details (read-only)</h2>
            {[
              { label: "Email", value: resident?.email },
              { label: "Unit number", value: resident?.unit_number },
              { label: "Resident type", value: resident?.resident_type },
              { label: "Association", value: association?.association_name },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-2 border-b border-sand last:border-0">
                <span className="text-body-brown text-sm">{r.label}</span>
                <span className="text-navy text-sm font-medium capitalize">{r.value || "—"}</span>
              </div>
            ))}
          </div>

          <button type="submit" disabled={saving} className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Profile"}
          </button>
        </form>
      </div>
    </PortalLayout>
  );
}

function Field({ label, value, onChange, required }) {
  return (
    <div>
      <label className="block text-navy font-medium text-sm mb-1.5">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
    </div>
  );
}