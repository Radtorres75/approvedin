import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FLORIDA_COUNTIES, ASSOCIATION_TYPES } from "@/lib/constants";
import { ChevronRight, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

const STEP_LABELS = ["Account", "Association", "Compliance"];

export default function AssociationOnboarding() {
  const [step, setStep] = useState(0);
  const [assocId, setAssocId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [creds, setCreds] = useState({ first_name: "", last_name: "", email: "", password: "", confirm_password: "", tos: false });
  const [s1, setS1] = useState({ association_name: "", association_type: "", florida_county: "", city: "", street_address: "", zip_code: "", phone_number: "", number_of_units: "", management_company_name: "" });
  const [s2, setS2] = useState({ require_coi: true, require_trade_license: true, require_workers_comp: true, require_sunbiz: true, gl_minimum_coverage: "", auto_approve_if_compliant: false, custom_compliance_notes: "" });

  const parseError = (err) => {
    const msg = err?.message || err?.error || err?.toString() || "";
    const lower = msg.toLowerCase();
    if (lower.includes("already exists") || lower.includes("already registered") || lower.includes("duplicate") || lower.includes("email_exists")) {
      return "An account with this email already exists. Please log in instead.";
    }
    if (lower.includes("password") && (lower.includes("short") || lower.includes("weak") || lower.includes("length"))) {
      return "Your password must be at least 8 characters.";
    }
    if (lower.includes("network") || lower.includes("fetch") || lower.includes("connection")) {
      return "Connection error. Please check your internet and try again.";
    }
    if (msg && !lower.includes("object object")) return msg;
    return "Something went wrong. Please try again or contact support@approvedin.com";
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!creds.tos) { setError("Please accept the Terms of Service."); return; }
    if (creds.password.length < 8) { setError("Your password must be at least 8 characters."); return; }
    if (creds.password !== creds.confirm_password) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    try {
      // Register without role — Base44 doesn't allow client-side role assignment
      await base44.auth.register({
        email: creds.email,
        password: creds.password,
        first_name: creds.first_name,
        last_name: creds.last_name,
      });

      // Log in immediately — no OTP step
      await base44.auth.loginViaEmailPassword(creds.email, creds.password);
      await new Promise(r => setTimeout(r, 800));

      const user = await base44.auth.me();
      if (!user || !user.id) throw new Error("Could not establish session. Please log in.");

      const assoc = await base44.entities.Association.create({
        user_id: user.id,
        association_name: "",
        onboarding_complete: false,
        subscription_tier: "free",
        require_coi: true,
        require_trade_license: true,
        require_workers_comp: true,
        require_sunbiz: true,
      });
      if (!assoc || !assoc.id) throw new Error("Account created but association profile could not be saved. Please log in to continue.");
      setAssocId(assoc.id);
      setStep(1);
    } catch (err) {
      console.error("Account creation error:", err);
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStep1 = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const link = `${window.location.origin}/resident/signup?association=${assocId}`;
      await base44.entities.Association.update(assocId, {
        ...s1,
        number_of_units: parseInt(s1.number_of_units) || 0,
        resident_signup_link: link,
      });
      setStep(2);
    } catch (err) {
      console.error("handleStep1 error:", err);
      const msg = err?.message || err?.toString() || "";
      setError(msg && !msg.toLowerCase().includes("object object") ? msg : "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await base44.entities.Association.update(assocId, {
        ...s2,
        gl_minimum_coverage: s2.gl_minimum_coverage ? parseFloat(s2.gl_minimum_coverage) : null,
        onboarding_complete: true,
      });
      window.location.href = "/portal/association";
    } catch (err) {
      console.error("handleStep2 error:", err);
      const msg = err?.message || err?.toString() || "";
      setError(msg && !msg.toLowerCase().includes("object object") ? msg : "Failed to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <nav className="bg-navy py-4 px-6">
        <Link to="/" className="flex items-center">
          <img
            src="https://media.base44.com/images/public/69e9180b18cbe750b3daf184/9a7ce84a1_approvedin-logo-nav-transparent.png"
            alt="ApprovedIn"
            style={{ height: "36px", width: "auto", objectFit: "contain", display: "block" }}
          />
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Progress — only show after account created */}
          {step > 0 && (
            <div className="flex items-center gap-2 mb-8 justify-center">
              {STEP_LABELS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-2 ${i + 1 <= step ? "text-teal-dark" : "text-body-brown/40"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i + 1 < step ? "bg-teal border-teal text-navy" : i + 1 === step ? "border-teal text-teal bg-white" : "border-sand-dark text-body-brown/40 bg-white"}`}>
                      {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{s}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && <div className={`flex-1 h-px max-w-12 ${i + 1 < step ? "bg-teal" : "bg-sand-dark"}`} />}
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-sand-dark p-8">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
                {error}
                {(error.includes("already exists") || error.includes("log in")) && (
                  <Link to="/signin" className="block mt-2 underline font-semibold text-red-700 hover:text-red-900">Log In →</Link>
                )}
              </div>
            )}

            {/* STEP 0: Create Account */}
            {step === 0 && (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-navy mb-1">Create your account</h2>
                  <p className="text-body-brown text-sm">Free for all Florida associations — always.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First name *" value={creds.first_name} onChange={v => setCreds({...creds, first_name: v})} required />
                  <Field label="Last name *" value={creds.last_name} onChange={v => setCreds({...creds, last_name: v})} required />
                </div>
                <Field label="Email address *" type="email" value={creds.email} onChange={v => setCreds({...creds, email: v})} required />
                <div className="relative">
                  <Field label="Password * (min 8 characters)" type={showPw ? "text" : "password"} value={creds.password} onChange={v => setCreds({...creds, password: v})} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-8 text-body-brown hover:text-navy">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <Field label="Confirm password *" type={showPw2 ? "text" : "password"} value={creds.confirm_password} onChange={v => setCreds({...creds, confirm_password: v})} required />
                  <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-8 text-body-brown hover:text-navy">
                    {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={creds.tos} onChange={e => setCreds({...creds, tos: e.target.checked})} className="mt-0.5 accent-teal" required />
                  <span className="text-sm text-body-brown">I agree to the <a href="/terms" className="text-teal-dark underline" target="_blank">Terms of Service</a> and <a href="/privacy" className="text-teal-dark underline" target="_blank">Privacy Policy</a></span>
                </label>
                <SubmitBtn loading={loading} label="Create Account & Continue" />
                <p className="text-center text-body-brown text-xs pt-1">
                  Already have an account? <Link to="/signin" className="text-teal-dark font-semibold hover:underline">Log In</Link>
                </p>
              </form>
            )}

            {/* STEP 1: Association Details */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-navy mb-1">Your association</h2>
                  <p className="text-body-brown text-sm">Tell us about your community.</p>
                </div>
                <Field label="Association name *" value={s1.association_name} onChange={v => setS1({...s1, association_name: v})} required />
                <SelectField label="Association type *" value={s1.association_type} onChange={v => setS1({...s1, association_type: v})} options={ASSOCIATION_TYPES} required />
                <div className="grid grid-cols-2 gap-4">
                  <SelectField label="Florida county *" value={s1.florida_county} onChange={v => setS1({...s1, florida_county: v})} options={FLORIDA_COUNTIES} required />
                  <Field label="City *" value={s1.city} onChange={v => setS1({...s1, city: v})} required />
                </div>
                <Field label="Street address *" value={s1.street_address} onChange={v => setS1({...s1, street_address: v})} required />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="ZIP code *" value={s1.zip_code} onChange={v => setS1({...s1, zip_code: v})} required />
                  <Field label="Phone number *" value={s1.phone_number} onChange={v => setS1({...s1, phone_number: v})} required />
                </div>
                <Field label="Number of units *" type="number" value={s1.number_of_units} onChange={v => setS1({...s1, number_of_units: v})} required />
                <Field label="Management company name (optional)" value={s1.management_company_name} onChange={v => setS1({...s1, management_company_name: v})} />
                <SubmitBtn loading={loading} label="Continue" />
              </form>
            )}

            {/* STEP 2: Compliance */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-5">
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
                      <input type="checkbox" checked={s2[r.key]} onChange={e => setS2({...s2, [r.key]: e.target.checked})} className="accent-teal w-4 h-4" />
                    </label>
                  ))}
                </div>
                <Field label="Minimum GL Coverage ($)" type="number" value={s2.gl_minimum_coverage} onChange={v => setS2({...s2, gl_minimum_coverage: v})} placeholder="e.g. 1000000" />
                <label className="flex items-center justify-between p-3 bg-cream rounded-xl border border-sand-dark cursor-pointer">
                  <div>
                    <span className="text-navy font-medium text-sm block">Auto-approve compliant vendors</span>
                    <span className="text-body-brown text-xs">Automatically approve vendors with all required documents current</span>
                  </div>
                  <input type="checkbox" checked={s2.auto_approve_if_compliant} onChange={e => setS2({...s2, auto_approve_if_compliant: e.target.checked})} className="accent-teal w-4 h-4" />
                </label>
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Custom compliance notes (shown to vendors)</label>
                  <textarea
                    value={s2.custom_compliance_notes}
                    onChange={e => setS2({...s2, custom_compliance_notes: e.target.value})}
                    className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none h-24"
                    placeholder="Any specific requirements or notes for vendors..."
                  />
                </div>
                <SubmitBtn loading={loading} label="Complete Setup" />
              </form>
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
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-navy font-medium text-sm mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white">
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SubmitBtn({ loading, label }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
      {loading ? "Saving..." : <>{label} <ChevronRight size={16} /></>}
    </button>
  );
}
