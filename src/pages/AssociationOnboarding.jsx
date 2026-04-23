import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FLORIDA_COUNTIES, ASSOCIATION_TYPES } from "@/lib/constants";
import { ChevronRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import EmailVerification from "@/components/auth/EmailVerification";

const STEPS = ["Account", "Association", "Compliance"];

export default function AssociationOnboarding() {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [assocId, setAssocId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);

  const navigate = useNavigate();

  const [s1, setS1] = useState({ first_name: "", last_name: "", email: "", password: "", tos: false });
  const [s2, setS2] = useState({ association_name: "", association_type: "", florida_county: "", city: "", street_address: "", zip_code: "", phone_number: "", number_of_units: "", management_company_name: "" });
  const [s3, setS3] = useState({ require_coi: true, require_trade_license: true, require_workers_comp: true, require_sunbiz: true, gl_minimum_coverage: "", auto_approve_if_compliant: false, custom_compliance_notes: "" });

  const handleStep1 = async (e) => {
    e.preventDefault();
    if (!s1.tos) { setError("Please accept the Terms of Service."); return; }
    setLoading(true); setError("");
    try {
      await base44.auth.register({ email: s1.email, password: s1.password });
      // Show OTP verification screen
      setPendingVerification(true);
    } catch (err) {
      console.error("Account creation error:", err);
      const msg = err?.message || err?.error || err?.toString() || "";
      const lower = msg.toLowerCase();
      if (lower.includes("already exists") || lower.includes("already registered") || lower.includes("duplicate")) {
        setError("An account with this email address already exists. Please log in instead.");
      } else if (lower.includes("password") && lower.includes("short")) {
        setError("Your password must be at least 8 characters.");
      } else if (lower.includes("user_not_registered") || lower.includes("not registered")) {
        setError("Registration is currently restricted. Please contact support at support@approvedin.com");
      } else if (msg) {
        setError(msg);
      } else {
        setError("Something went wrong on our end. Please try again in a moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const link = `${window.location.origin}/resident/signup?association=${assocId}`;
      await base44.entities.Association.update(assocId, {
        ...s2,
        number_of_units: parseInt(s2.number_of_units) || 0,
        resident_signup_link: link,
      });
      setStep(3);
    } catch (err) {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await base44.entities.Association.update(assocId, {
        ...s3,
        gl_minimum_coverage: s3.gl_minimum_coverage ? parseFloat(s3.gl_minimum_coverage) : null,
        onboarding_complete: true,
      });
      window.location.href = "/portal/association";
    } catch (err) {
      setError("Failed to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <nav className="bg-navy py-4 px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center">
            <span className="text-navy font-black text-xs">A</span>
          </div>
          <span className="text-white font-bold text-base">ApprovedIn</span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${i + 1 <= step ? "text-teal-dark" : "text-body-brown/40"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i + 1 < step ? "bg-teal border-teal text-navy" : i + 1 === step ? "border-teal text-teal bg-white" : "border-sand-dark text-body-brown/40 bg-white"}`}>
                    {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px max-w-12 ${i + 1 < step ? "bg-teal" : "bg-sand-dark"}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-sand-dark p-8">
            {pendingVerification ? (
              <EmailVerification
                email={s1.email}
                onVerified={async () => {
                  try {
                    await base44.auth.loginViaEmailPassword(s1.email, s1.password);
                    await base44.auth.updateMe({ first_name: s1.first_name, last_name: s1.last_name, role: "association_manager" });
                    const user = await base44.auth.me();
                    setUserId(user.id);
                    const assoc = await base44.entities.Association.create({ user_id: user.id, association_name: "", onboarding_complete: false, subscription_tier: "free" });
                    setAssocId(assoc.id);
                    setPendingVerification(false);
                    setStep(2);
                  } catch (err) {
                    setError("Verified but setup failed. Please try logging in.");
                    setPendingVerification(false);
                  }
                }}
              />
            ) : (
            <>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
                {error}
                {error.includes("already exists") && (
                  <Link to="/signin" className="block mt-2 underline font-semibold text-red-700 hover:text-red-900">Log In →</Link>
                )}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-navy mb-1">Create your account</h2>
                  <p className="text-body-brown text-sm">Free for all Florida associations — always.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First name *" value={s1.first_name} onChange={v => setS1({...s1, first_name: v})} required />
                  <Field label="Last name *" value={s1.last_name} onChange={v => setS1({...s1, last_name: v})} required />
                </div>
                <Field label="Email address *" type="email" value={s1.email} onChange={v => setS1({...s1, email: v})} required />
                <Field label="Password *" type="password" value={s1.password} onChange={v => setS1({...s1, password: v})} required />
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={s1.tos} onChange={e => setS1({...s1, tos: e.target.checked})} className="mt-0.5 accent-teal" required />
                  <span className="text-sm text-body-brown">I agree to the <a href="/terms" className="text-teal-dark underline" target="_blank">Terms of Service</a> and <a href="/privacy" className="text-teal-dark underline" target="_blank">Privacy Policy</a></span>
                </label>
                <SubmitBtn loading={loading} label="Continue" />
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-navy mb-1">Your association</h2>
                  <p className="text-body-brown text-sm">Tell us about your community.</p>
                </div>
                <Field label="Association name *" value={s2.association_name} onChange={v => setS2({...s2, association_name: v})} required />
                <SelectField label="Association type *" value={s2.association_type} onChange={v => setS2({...s2, association_type: v})} options={ASSOCIATION_TYPES} required />
                <div className="grid grid-cols-2 gap-4">
                  <SelectField label="Florida county *" value={s2.florida_county} onChange={v => setS2({...s2, florida_county: v})} options={FLORIDA_COUNTIES} required />
                  <Field label="City *" value={s2.city} onChange={v => setS2({...s2, city: v})} required />
                </div>
                <Field label="Street address *" value={s2.street_address} onChange={v => setS2({...s2, street_address: v})} required />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="ZIP code *" value={s2.zip_code} onChange={v => setS2({...s2, zip_code: v})} required />
                  <Field label="Phone number *" value={s2.phone_number} onChange={v => setS2({...s2, phone_number: v})} required />
                </div>
                <Field label="Number of units *" type="number" value={s2.number_of_units} onChange={v => setS2({...s2, number_of_units: v})} required />
                <Field label="Management company name (optional)" value={s2.management_company_name} onChange={v => setS2({...s2, management_company_name: v})} />
                <SubmitBtn loading={loading} label="Continue" />
              </form>
            )}

            {step === 3 && (<form onSubmit={handleStep3} className="space-y-5">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-navy mb-1">Compliance requirements</h2>
                  <p className="text-body-brown text-sm">Set your requirements for vendors applying to your directory.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { key: "require_coi", label: "Certificate of Insurance (COI)" },
                    { key: "require_trade_license", label: "Trade License" },
                    { key: "require_workers_comp", label: "Workers Compensation" },
                    { key: "require_sunbiz", label: "Florida Sunbiz Corporate Standing" },
                  ].map(r => (
                    <label key={r.key} className="flex items-center justify-between p-3 bg-cream rounded-xl border border-sand-dark cursor-pointer hover:bg-sand transition-colors">
                      <span className="text-navy font-medium text-sm">{r.label}</span>
                      <input type="checkbox" checked={s3[r.key]} onChange={e => setS3({...s3, [r.key]: e.target.checked})} className="accent-teal w-4 h-4" />
                    </label>
                  ))}
                </div>
                <Field label="Minimum GL Coverage ($)" type="number" value={s3.gl_minimum_coverage} onChange={v => setS3({...s3, gl_minimum_coverage: v})} placeholder="e.g. 1000000" />
                <label className="flex items-center justify-between p-3 bg-cream rounded-xl border border-sand-dark cursor-pointer">
                  <div>
                    <span className="text-navy font-medium text-sm block">Auto-approve compliant vendors</span>
                    <span className="text-body-brown text-xs">Automatically approve vendors with all required documents current</span>
                  </div>
                  <input type="checkbox" checked={s3.auto_approve_if_compliant} onChange={e => setS3({...s3, auto_approve_if_compliant: e.target.checked})} className="accent-teal w-4 h-4" />
                </label>
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Custom compliance notes (shown to vendors)</label>
                  <textarea
                    value={s3.custom_compliance_notes}
                    onChange={e => setS3({...s3, custom_compliance_notes: e.target.value})}
                    className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none h-24"
                    placeholder="Any specific requirements or notes for vendors..."
                  />
                </div>
                <SubmitBtn loading={loading} label="Complete Setup" />
              </form>
            )}
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }) {
  return (
    <div>
      <label className="block text-navy font-medium text-sm mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-navy font-medium text-sm mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white"
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SubmitBtn({ loading, label }) {
  return (
    <button type="submit" disabled={loading} className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
      {loading ? "Saving..." : <>{label} <ChevronRight size={16} /></>}
    </button>
  );
}