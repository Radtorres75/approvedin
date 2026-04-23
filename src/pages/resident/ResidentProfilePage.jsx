import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ResidentLayout from "@/components/layout/ResidentLayout";
import { RefreshCw } from "lucide-react";

export default function ResidentProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resident, setResident] = useState(null);
  const [association, setAssociation] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [form, setForm] = useState({ first_name: "", last_name: "", phone_number: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadPage(); }, []);

  const loadPage = async () => {
    try {
      setLoading(true); setError(null);
      const currentUser = await base44.auth.me();
      if (!currentUser) { navigate("/signin"); return; }
      if (currentUser.role !== "resident") { navigate("/signin"); return; }
      setUserEmail(currentUser.email);
      const residents = await base44.entities.Resident.filter({ user_id: currentUser.id });
      if (!residents?.length) { navigate("/resident/signup"); return; }
      const r = residents[0];
      setResident(r);
      setForm({ first_name: r.first_name || "", last_name: r.last_name || "", phone_number: r.phone_number || "", address: r.address || "" });

      if (r.association_id) {
        const assocs = await base44.entities.Association.filter({ onboarding_complete: true });
        const a = assocs.find(x => x.id === r.association_id);
        setAssociation(a);
      }
    } catch (err) {
      setError("Could not load profile. Please try again.");
    } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Resident.update(resident.id, {
      first_name: form.first_name,
      last_name: form.last_name,
      phone_number: form.phone_number,
      address: form.address,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
    loadPage();
  };

  if (loading) return <ResidentLayout title="Profile"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div></ResidentLayout>;
  if (error) return <ResidentLayout title="Profile"><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-red-600">{error}</p><button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"><RefreshCw size={14} /> Retry</button></div></ResidentLayout>;

  return (
    <ResidentLayout title="Profile">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-black text-navy mb-8">My Profile</h2>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Editable fields */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-4">
            <h3 className="text-navy font-bold text-base">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name *" value={form.first_name} onChange={v => setForm({ ...form, first_name: v })} required />
              <Field label="Last name *" value={form.last_name} onChange={v => setForm({ ...form, last_name: v })} required />
            </div>
            <Field label="Phone number" value={form.phone_number} onChange={v => setForm({ ...form, phone_number: v })} />
            <Field label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
          </div>

          {/* Read-only fields */}
          <div className="bg-white rounded-2xl border border-sand-dark p-6 space-y-4">
            <h3 className="text-navy font-bold text-base">Account Information</h3>
            <ReadOnly label="Email address" value={userEmail} />
            <ReadOnly label="Unit number" value={resident?.unit_number} />
            <ReadOnly label="Association" value={association?.association_name || "—"} />
            <ReadOnly label="Resident type" value={resident?.resident_type === "owner" ? "Owner" : resident?.resident_type === "tenant" ? "Tenant" : "—"} />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
            {saving ? "Saving..." : saved ? "✓ Profile saved!" : "Save Profile"}
          </button>
        </form>
      </div>
    </ResidentLayout>
  );
}

function Field({ label, value, onChange, required }) {
  return (
    <div>
      <label className="block text-navy font-medium text-sm mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
    </div>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div>
      <label className="block text-body-brown text-xs font-semibold uppercase tracking-wider mb-1">{label}</label>
      <p className="text-navy font-medium text-sm">{value || "—"}</p>
    </div>
  );
}