import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FLORIDA_COUNTIES, TRADE_CATEGORIES } from "@/lib/constants";
import { ChevronRight, CheckCircle, Upload, X } from "lucide-react";

const STEP_LABELS = ["Credentials", "Business Info", "Categories", "Logo", "COI", "Trade License", "Workers Comp", "Sunbiz", "Review"];
const TOTAL_STEPS = 8;

export default function VendorSetup() {
  const [step, setStep] = useState(0); // 0 = credentials
  const [vendorId, setVendorId] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState("");


  const navigate = useNavigate();

  const [creds, setCreds] = useState({ email: "", password: "", confirm_password: "", tos: false });
  const [s1, setS1] = useState({ business_name: "", business_description: "", business_phone: "", business_email: "", business_website: "", years_in_business: "" });
  const [s2, setS2] = useState({ trade_categories: [], florida_counties_served: [] });
  const [logoFile, setLogoFile] = useState(null);
  const [coiData, setCoiData] = useState({ file: null, gl_expiration_date: "", gl_coverage_limit: "", auto_option: "date", auto_expiration_date: "", umbrella_option: "date", umbrella_expiration_date: "", professional_option: "date", professional_expiration_date: "" });
  const [tlData, setTlData] = useState({ file: null, license_number: "", issuing_authority: "", expiration_date: "" });
  const [wcData, setWcData] = useState({ option: "policy_uploaded", file: null, expiration_date: "" });
  const [sunbizData, setSunbizData] = useState({ file: null });

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const vendors = await base44.entities.Vendor.filter({ user_id: user.id });
          if (vendors.length > 0) {
            const v = vendors[0];
            setVendorId(v.id);
            setVendor(v);
            const resumeStep = (v.setup_highest_completed_step || 0) + 1;
            setStep(Math.min(resumeStep, TOTAL_STEPS));
            if (v.setup_highest_completed_step >= TOTAL_STEPS) {
              window.location.href = "/portal/vendor";
              return;
            }
          } else {
            setStep(0);
          }
        }
      } catch {}
      setInitLoading(false);
    };
    checkExisting();
  }, [navigate]);

  const saveStep = async (stepNum) => {
    if (!vendorId) return;
    await base44.entities.Vendor.update(vendorId, {
      setup_current_step: stepNum,
      setup_highest_completed_step: Math.max(vendor?.setup_highest_completed_step || 0, stepNum),
    });
    // trigger profile recalculation
    await base44.functions.invoke("recalculateProfileCompletion", { vendor_id: vendorId });
  };

  const parseError = (err) => {
    const msg = err?.message || err?.error || err?.toString() || "";
    const lower = msg.toLowerCase();
    if (lower.includes("already exists") || lower.includes("already registered") || lower.includes("duplicate") || lower.includes("email_exists")) {
      return "An account with this email address already exists. Please log in instead.";
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

  const handleCreds = async (e) => {
    e.preventDefault();
    if (!creds.confirm_password) { setError("Please confirm your password."); return; }
    if (creds.password.length < 8) { setError("Your password must be at least 8 characters."); return; }
    if (creds.password !== creds.confirm_password) { setError("Passwords do not match."); return; }
    if (!creds.tos) { setError("Please accept the Terms of Service."); return; }
    setLoading(true); setError("");
    try {
      // 1. Register
      await base44.auth.register({ email: creds.email, password: creds.password, role: "vendor" });
      // 2. Login immediately
      await base44.auth.loginViaEmailPassword(creds.email, creds.password);
      // 3. Update profile
      await base44.auth.updateMe({ is_active: true, profile_complete: false });
      // 4. Get user and create Vendor record
      const user = await base44.auth.me();
      const today = new Date().toISOString().split("T")[0];
      const v = await base44.entities.Vendor.create({
        user_id: user.id, business_name: "", subscription_tier: "beta",
        beta_signup_date: today, setup_current_step: 1,
        setup_highest_completed_step: 0, profile_completion_percentage: 0,
        overall_compliance_status: "noncompliant", is_suspended: false,
      });
      setVendorId(v.id);
      setVendor(v);
      setInitLoading(false);
      setStep(1);
    } catch (err) {
      console.error("Vendor account creation error:", err);
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStep1 = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await base44.entities.Vendor.update(vendorId, {
        ...s1,
        years_in_business: s1.years_in_business ? parseInt(s1.years_in_business) : null,
      });
      await saveStep(1);
      setStep(2);
    } catch { setError("Failed to save."); } finally { setLoading(false); }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    if (s2.trade_categories.length === 0) { setError("Select at least one trade category."); return; }
    if (s2.florida_counties_served.length === 0) { setError("Select at least one Florida county."); return; }
    setLoading(true); setError("");
    try {
      await base44.entities.Vendor.update(vendorId, s2);
      await saveStep(2);
      setStep(3);
    } catch { setError("Failed to save."); } finally { setLoading(false); }
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      if (logoFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: logoFile });
        await base44.entities.Vendor.update(vendorId, { logo_url: file_url });
      }
      await saveStep(3);
      setStep(4);
    } catch { setError("Failed to upload."); } finally { setLoading(false); }
  };

  const handleStep4 = async (e) => {
    e.preventDefault();
    if (!coiData.file) { setError("Please upload your COI document."); return; }
    if (!coiData.gl_expiration_date) { setError("General Liability expiration date is required."); return; }
    setLoading(true); setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: coiData.file });
      const docData = {
        vendor_id: vendorId,
        document_type: "coi",
        file_url,
        file_name: coiData.file.name,
        upload_date: new Date().toISOString().split("T")[0],
        status: "pending_review",
        is_archived: false,
        version_number: 1,
        gl_expiration_date: coiData.gl_expiration_date,
        gl_coverage_limit: coiData.gl_coverage_limit ? parseFloat(coiData.gl_coverage_limit) : null,
        auto_do_not_carry: coiData.auto_option === "do_not_carry",
        auto_hold_harmless: coiData.auto_option === "hold_harmless",
        auto_expiration_date: coiData.auto_option === "date" ? coiData.auto_expiration_date : null,
        umbrella_do_not_carry: coiData.umbrella_option === "do_not_carry",
        umbrella_hold_harmless: coiData.umbrella_option === "hold_harmless",
        umbrella_expiration_date: coiData.umbrella_option === "date" ? coiData.umbrella_expiration_date : null,
        professional_do_not_carry: coiData.professional_option === "do_not_carry",
        professional_hold_harmless: coiData.professional_option === "hold_harmless",
        professional_expiration_date: coiData.professional_option === "date" ? coiData.professional_expiration_date : null,
      };
      await base44.entities.ComplianceDocument.create(docData);
      await saveStep(4);
      setStep(5);
    } catch { setError("Failed to upload."); } finally { setLoading(false); }
  };

  const handleStep5 = async (e) => {
    e.preventDefault();
    if (!tlData.file) { setError("Please upload your trade license."); return; }
    setLoading(true); setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: tlData.file });
      await base44.entities.ComplianceDocument.create({
        vendor_id: vendorId,
        document_type: "trade_license",
        file_url,
        file_name: tlData.file.name,
        upload_date: new Date().toISOString().split("T")[0],
        status: "pending_review",
        is_archived: false,
        version_number: 1,
        license_number: tlData.license_number,
        issuing_authority: tlData.issuing_authority,
        expiration_date: tlData.expiration_date,
      });
      await saveStep(5);
      setStep(6);
    } catch { setError("Failed to upload."); } finally { setLoading(false); }
  };

  const handleStep6 = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      let fileUrl = null;
      if (wcData.option === "policy_uploaded" && wcData.file) {
        const res = await base44.integrations.Core.UploadFile({ file: wcData.file });
        fileUrl = res.file_url;
      }
      await base44.entities.ComplianceDocument.create({
        vendor_id: vendorId,
        document_type: "workers_comp",
        file_url: fileUrl || "",
        file_name: wcData.file?.name || wcData.option,
        upload_date: new Date().toISOString().split("T")[0],
        status: "pending_review",
        is_archived: false,
        version_number: 1,
        workers_comp_option: wcData.option,
        expiration_date: wcData.option === "policy_uploaded" ? wcData.expiration_date : null,
      });
      await saveStep(6);
      setStep(7);
    } catch { setError("Failed to save."); } finally { setLoading(false); }
  };

  const handleStep7 = async (e) => {
    e.preventDefault();
    if (!sunbizData.file) { setError("Please upload your Sunbiz document."); return; }
    setLoading(true); setError("");
    try {
      const year = new Date().getFullYear();
      const { file_url } = await base44.integrations.Core.UploadFile({ file: sunbizData.file });
      await base44.entities.ComplianceDocument.create({
        vendor_id: vendorId,
        document_type: "sunbiz",
        file_url,
        file_name: sunbizData.file.name,
        upload_date: new Date().toISOString().split("T")[0],
        status: "pending_review",
        is_archived: false,
        version_number: 1,
        expiration_date: `${year}-05-01`,
      });
      await saveStep(7);
      setStep(8);
    } catch { setError("Failed to upload."); } finally { setLoading(false); }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await base44.entities.Vendor.update(vendorId, {
        setup_highest_completed_step: TOTAL_STEPS,
        setup_current_step: TOTAL_STEPS,
      });
      await base44.functions.invoke("recalculateProfileCompletion", { vendor_id: vendorId });
      window.location.href = "/portal/vendor";
    } catch { setError("Failed to complete."); } finally { setLoading(false); }
  };

  const toggleMulti = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  if (initLoading) return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <nav className="bg-navy py-4 px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center">
            <span className="text-navy font-black text-xs">A</span>
          </div>
          <span className="text-white font-bold text-base">ApprovedIn</span>
          <span className="text-white/40 text-sm ml-2">— Vendor Setup</span>
        </div>
      </nav>

      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {step > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-body-brown mb-2">
                <span>Step {step} of {TOTAL_STEPS}</span>
                <span>{STEP_LABELS[step]}</span>
              </div>
              <div className="h-1.5 bg-sand-dark rounded-full overflow-hidden">
                <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-sand-dark p-8">
            <>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
                {error}
                {(error.includes("already exists") || error.includes("log in")) && (
                  <a href="/signin" className="block mt-2 underline font-semibold text-red-700 hover:text-red-900">Log In →</a>
                )}
              </div>
            )}

            {/* Step 0: Credentials */}
            {step === 0 && (
              <form onSubmit={handleCreds} className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-navy mb-1">Create your vendor account</h2>
                  <p className="text-body-brown text-sm">Free during beta — no credit card required.</p>
                </div>
                <Field label="Email address *" type="email" value={creds.email} onChange={v => setCreds({...creds, email: v})} required />
                <Field label="Password * (min 8 characters)" type="password" value={creds.password} onChange={v => setCreds({...creds, password: v})} required />
                <Field label="Confirm password *" type="password" value={creds.confirm_password} onChange={v => setCreds({...creds, confirm_password: v})} required />
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={creds.tos} onChange={e => setCreds({...creds, tos: e.target.checked})} className="mt-0.5 accent-teal" required />
                  <span className="text-sm text-body-brown">I agree to the <a href="/terms" className="text-teal-dark underline" target="_blank">Terms of Service</a> and <a href="/privacy" className="text-teal-dark underline" target="_blank">Privacy Policy</a></span>
                </label>
                <SubmitBtn loading={loading} label="Create Account & Continue" />
                <p className="text-center text-body-brown text-xs pt-1">
                  Already have an account? <a href="/signin" className="text-teal-dark font-semibold hover:underline">Log In</a>
                </p>
              </form>
            )}

            {/* Step 1: Business Info */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <h2 className="text-xl font-black text-navy mb-4">Business information</h2>
                <Field label="Business name *" value={s1.business_name} onChange={v => setS1({...s1, business_name: v})} required />
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Business description *</label>
                  <textarea value={s1.business_description} onChange={e => setS1({...s1, business_description: e.target.value})} required className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none h-20" placeholder="Describe your services..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Business phone *" value={s1.business_phone} onChange={v => setS1({...s1, business_phone: v})} required />
                  <Field label="Business email *" type="email" value={s1.business_email} onChange={v => setS1({...s1, business_email: v})} required />
                </div>
                <Field label="Website (optional)" value={s1.business_website} onChange={v => setS1({...s1, business_website: v})} />
                <Field label="Years in business (optional)" type="number" value={s1.years_in_business} onChange={v => setS1({...s1, years_in_business: v})} />
                <SubmitBtn loading={loading} label="Continue" />
              </form>
            )}

            {/* Step 2: Categories & Counties */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-5">
                <h2 className="text-xl font-black text-navy mb-4">Trade categories & coverage</h2>
                <div>
                  <label className="block text-navy font-medium text-sm mb-2">Trade categories * (select all that apply)</label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-sand-dark rounded-lg">
                    {TRADE_CATEGORIES.map(cat => (
                      <button key={cat} type="button" onClick={() => setS2({...s2, trade_categories: toggleMulti(s2.trade_categories, cat)})}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${s2.trade_categories.includes(cat) ? "bg-teal text-navy border-teal" : "bg-white text-body-brown border-sand-dark hover:border-teal/50"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                  {s2.trade_categories.length > 0 && <p className="text-teal-dark text-xs mt-1">{s2.trade_categories.length} selected</p>}
                </div>
                <div>
                  <label className="block text-navy font-medium text-sm mb-2">Florida counties served * (select all that apply)</label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-sand-dark rounded-lg">
                    {FLORIDA_COUNTIES.map(county => (
                      <button key={county} type="button" onClick={() => setS2({...s2, florida_counties_served: toggleMulti(s2.florida_counties_served, county)})}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${s2.florida_counties_served.includes(county) ? "bg-teal text-navy border-teal" : "bg-white text-body-brown border-sand-dark hover:border-teal/50"}`}>
                        {county}
                      </button>
                    ))}
                  </div>
                  {s2.florida_counties_served.length > 0 && <p className="text-teal-dark text-xs mt-1">{s2.florida_counties_served.length} selected</p>}
                </div>
                <SubmitBtn loading={loading} label="Continue" />
              </form>
            )}

            {/* Step 3: Logo */}
            {step === 3 && (
              <form onSubmit={handleStep3} className="space-y-5">
                <h2 className="text-xl font-black text-navy mb-1">Business logo</h2>
                <p className="text-body-brown text-sm mb-4">Optional — add a logo to make your profile stand out.</p>
                <FileUpload label="Upload logo (optional)" file={logoFile} onFile={setLogoFile} accept="image/*" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(4)} className="flex-1 border border-sand-dark text-body-brown font-medium py-3 rounded-xl text-sm hover:bg-sand transition-colors">Skip for now</button>
                  <SubmitBtn loading={loading} label="Continue" flex1 />
                </div>
              </form>
            )}

            {/* Step 4: COI */}
            {step === 4 && (
              <form onSubmit={handleStep4} className="space-y-5">
                <h2 className="text-xl font-black text-navy mb-1">Certificate of Insurance (COI)</h2>
                <FileUpload label="Upload COI document *" file={coiData.file} onFile={f => setCoiData({...coiData, file: f})} />
                <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 space-y-4">
                  <h3 className="text-navy font-bold text-sm">General Liability — Required</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Expiration date *" type="date" value={coiData.gl_expiration_date} onChange={v => setCoiData({...coiData, gl_expiration_date: v})} required />
                    <Field label="Coverage limit ($)" type="number" value={coiData.gl_coverage_limit} onChange={v => setCoiData({...coiData, gl_coverage_limit: v})} />
                  </div>
                </div>
                {[
                  { key: "auto", label: "Commercial Auto" },
                  { key: "umbrella", label: "Umbrella / Excess Liability" },
                  { key: "professional", label: "Professional Liability" },
                ].map(({ key, label }) => (
                  <div key={key} className="bg-sand rounded-xl p-4 space-y-3">
                    <h3 className="text-navy font-bold text-sm">{label}</h3>
                    <div className="flex gap-3">
                      {["date", "do_not_carry", "hold_harmless"].map(opt => (
                        <label key={opt} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border cursor-pointer text-xs font-medium transition-colors ${coiData[`${key}_option`] === opt ? "bg-teal text-navy border-teal" : "bg-white text-body-brown border-sand-dark hover:border-teal/40"}`}>
                          <input type="radio" name={`${key}_opt`} value={opt} checked={coiData[`${key}_option`] === opt} onChange={() => setCoiData({...coiData, [`${key}_option`]: opt})} className="sr-only" />
                          {opt === "date" ? "Expiration Date" : opt === "do_not_carry" ? "Do Not Carry" : "Hold Harmless"}
                        </label>
                      ))}
                    </div>
                    {coiData[`${key}_option`] === "date" && (
                      <Field label="Expiration date *" type="date" value={coiData[`${key}_expiration_date`]} onChange={v => setCoiData({...coiData, [`${key}_expiration_date`]: v})} required />
                    )}
                  </div>
                ))}
                <SubmitBtn loading={loading} label="Continue" />
              </form>
            )}

            {/* Step 5: Trade License */}
            {step === 5 && (
              <form onSubmit={handleStep5} className="space-y-4">
                <h2 className="text-xl font-black text-navy mb-4">Trade License</h2>
                <Field label="License number *" value={tlData.license_number} onChange={v => setTlData({...tlData, license_number: v})} required />
                <Field label="Issuing authority" value={tlData.issuing_authority} onChange={v => setTlData({...tlData, issuing_authority: v})} />
                <Field label="Expiration date *" type="date" value={tlData.expiration_date} onChange={v => setTlData({...tlData, expiration_date: v})} required />
                <FileUpload label="Upload trade license *" file={tlData.file} onFile={f => setTlData({...tlData, file: f})} />
                <SubmitBtn loading={loading} label="Continue" />
              </form>
            )}

            {/* Step 6: Workers Comp */}
            {step === 6 && (
              <form onSubmit={handleStep6} className="space-y-4">
                <h2 className="text-xl font-black text-navy mb-1">Workers Compensation</h2>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { val: "policy_uploaded", title: "Upload Policy", desc: "I have a workers compensation policy" },
                    { val: "hold_harmless", title: "Hold Harmless", desc: "Covered under a hold harmless agreement" },
                    { val: "do_not_carry", title: "Do Not Carry", desc: "Not required for my business type (e.g. sole proprietor)" },
                  ].map(opt => (
                    <label key={opt.val} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${wcData.option === opt.val ? "border-teal bg-teal/5" : "border-sand-dark bg-white hover:border-teal/30"}`}>
                      <input type="radio" name="wc_option" value={opt.val} checked={wcData.option === opt.val} onChange={() => setWcData({...wcData, option: opt.val})} className="mt-0.5 accent-teal" />
                      <div>
                        <span className="text-navy font-semibold text-sm block">{opt.title}</span>
                        <span className="text-body-brown text-xs">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {wcData.option === "policy_uploaded" && (
                  <div className="space-y-3">
                    <FileUpload label="Upload workers comp policy *" file={wcData.file} onFile={f => setWcData({...wcData, file: f})} />
                    <Field label="Expiration date *" type="date" value={wcData.expiration_date} onChange={v => setWcData({...wcData, expiration_date: v})} required />
                  </div>
                )}
                <SubmitBtn loading={loading} label="Continue" />
              </form>
            )}

            {/* Step 7: Sunbiz */}
            {step === 7 && (
              <form onSubmit={handleStep7} className="space-y-4">
                <h2 className="text-xl font-black text-navy mb-1">Florida Sunbiz Corporate Standing</h2>
                <div className="bg-teal/5 border border-teal/20 rounded-xl p-3 text-sm text-teal-dark font-medium">
                  Florida Sunbiz annual renewal is due May 1 each year.
                </div>
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Annual expiration date (read-only)</label>
                  <input type="text" value={`May 1, ${new Date().getFullYear()}`} readOnly className="w-full border border-sand-dark rounded-lg px-4 py-3 text-body-brown text-sm bg-sand cursor-not-allowed" />
                </div>
                <FileUpload label="Upload Sunbiz document *" file={sunbizData.file} onFile={f => setSunbizData({...sunbizData, file: f})} />
                <SubmitBtn loading={loading} label="Continue" />
              </form>
            )}

            {/* Step 8: Review */}
            {step === 8 && (
              <div className="space-y-4">
                <h2 className="text-xl font-black text-navy mb-4">Review & complete</h2>
                <div className="bg-teal/5 border border-teal/20 rounded-xl p-4">
                  <p className="text-teal-dark font-semibold text-sm mb-1">🎉 Setup complete!</p>
                  <p className="text-navy text-sm">Your vendor profile has been created. You can now apply to Florida associations and start getting approved.</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-sand"><span className="text-body-brown">Business info</span><span className="text-teal-dark font-medium flex items-center gap-1"><CheckCircle size={14} /> Saved</span></div>
                  <div className="flex justify-between py-2 border-b border-sand"><span className="text-body-brown">Categories & counties</span><span className="text-teal-dark font-medium flex items-center gap-1"><CheckCircle size={14} /> Saved</span></div>
                  <div className="flex justify-between py-2 border-b border-sand"><span className="text-body-brown">COI document</span><span className="text-teal-dark font-medium flex items-center gap-1"><CheckCircle size={14} /> Uploaded</span></div>
                  <div className="flex justify-between py-2 border-b border-sand"><span className="text-body-brown">Trade license</span><span className="text-teal-dark font-medium flex items-center gap-1"><CheckCircle size={14} /> Uploaded</span></div>
                  <div className="flex justify-between py-2 border-b border-sand"><span className="text-body-brown">Workers compensation</span><span className="text-teal-dark font-medium flex items-center gap-1"><CheckCircle size={14} /> Saved</span></div>
                  <div className="flex justify-between py-2"><span className="text-body-brown">Florida Sunbiz</span><span className="text-teal-dark font-medium flex items-center gap-1"><CheckCircle size={14} /> Uploaded</span></div>
                </div>
                <button onClick={handleComplete} disabled={loading} className="w-full bg-teal hover:bg-teal-dark text-navy font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
                  {loading ? "Finalizing..." : "Go to My Dashboard →"}
                </button>
              </div>
            )}
            </>
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

function FileUpload({ label, file, onFile, accept = "*" }) {
  return (
    <div>
      <label className="block text-navy font-medium text-sm mb-1.5">{label}</label>
      <div className="border-2 border-dashed border-sand-dark rounded-xl p-4 hover:border-teal/50 transition-colors">
        {file ? (
          <div className="flex items-center justify-between">
            <span className="text-navy text-sm font-medium truncate">{file.name}</span>
            <button type="button" onClick={() => onFile(null)} className="text-body-brown hover:text-red-500 ml-2"><X size={16} /></button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 cursor-pointer">
            <Upload size={20} className="text-body-brown" />
            <span className="text-body-brown text-sm">Click to upload</span>
            <input type="file" accept={accept} onChange={e => onFile(e.target.files[0])} className="sr-only" />
          </label>
        )}
      </div>
    </div>
  );
}

function SubmitBtn({ loading, label, flex1 }) {
  return (
    <button type="submit" disabled={loading} className={`${flex1 ? "flex-1" : "w-full"} bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2`}>
      {loading ? "Saving..." : <>{label} <ChevronRight size={16} /></>}
    </button>
  );
}