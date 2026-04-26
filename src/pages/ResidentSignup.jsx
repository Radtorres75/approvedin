import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, ChevronRight, Search, Eye, EyeOff, ShieldCheck } from "lucide-react";

const inputCls = (err) => `w-full border ${err ? "border-red-400" : "border-sand-dark"} rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white`;
const FormField = ({ label, error, children }) => (
  <div>
    <label className="block text-navy font-medium text-sm mb-1.5">{label}</label>
    {children}
    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
  </div>
);
const S2Field = FormField;
import { Link } from "react-router-dom";

const STEPS = ["Find Community", "Your Unit", "Create Account"];

export default function ResidentSignup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [associations, setAssociations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssoc, setSelectedAssoc] = useState(null);
  const [s2, setS2] = useState({
    street_address: "", unit_number: "", city: "", zip_code: "",
    resident_type: "", primary_phone: "", secondary_phone: "",
    email: "", move_in_date: ""
  });
  const [s2Errors, setS2Errors] = useState({});
  const [s3, setS3] = useState({
    first_name: "", last_name: "", password: "", confirm_password: "", tos: false
  });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const assocId = params.get("association");
    const load = async () => {
      const all = await base44.entities.Association.filter({ onboarding_complete: true });
      setAssociations(all);
      if (assocId) {
        const found = all.find(a => a.id === assocId);
        if (found) { setSelectedAssoc(found); setStep(2); }
      }
    };
    load();
  }, []);

  const filtered = associations.filter(a =>
    a.association_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.florida_county?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const parseError = (err) => {
    const msg = err?.message || err?.error || err?.toString() || "";
    const lower = msg.toLowerCase();
    if (lower.includes("already exists") || lower.includes("already registered") || lower.includes("duplicate") || lower.includes("email_exists")) {
      return { text: "An account with this email already exists. Please log in instead.", showLogin: true };
    }
    if (lower.includes("password") && (lower.includes("short") || lower.includes("weak") || lower.includes("length"))) {
      return { text: "Your password must be at least 8 characters." };
    }
    if (lower.includes("network") || lower.includes("fetch") || lower.includes("connection")) {
      return { text: "Connection error. Please check your internet and try again." };
    }
    if (msg && !lower.includes("object object")) return { text: msg };
    return { text: "Something went wrong. Please try again or contact support@approvedin.com" };
  };

  const validateStep2 = () => {
    const errs = {};
    if (!s2.street_address.trim()) errs.street_address = "Street address is required.";
    if (!s2.city.trim()) errs.city = "City is required.";
    if (!s2.zip_code.trim() || s2.zip_code.length !== 5) errs.zip_code = "A valid 5-digit ZIP code is required.";
    if (!s2.resident_type) errs.resident_type = "Please select your resident / owner type.";
    if (!s2.primary_phone.trim()) errs.primary_phone = "Primary phone number is required.";
    if (!s2.email.trim() || !s2.email.includes("@")) errs.email = "A valid email address is required.";
    return errs;
  };

  const validateStep3 = () => {
    const errs = {};
    if (!s3.first_name.trim()) errs.first_name = "First name is required.";
    if (!s3.last_name.trim()) errs.last_name = "Last name is required.";
    if (s3.password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (s3.password !== s3.confirm_password) errs.confirm_password = "Passwords do not match.";
    if (!s3.tos) errs.tos = "Please accept the Terms of Service.";
    return errs;
  };

  const handleAdvanceStep2 = () => {
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) { setS2Errors(errs); return; }
    setS2Errors({});
    setError("");
    setStep(3);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    const errs = validateStep3();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true); setError("");
    try {
      await base44.auth.register({
        email: s2.email,
        password: s3.password,
        first_name: s3.first_name,
        last_name: s3.last_name,
        role: "resident",
      });
      setPendingEmail(s2.email);
      setPendingPassword(s3.password);
      setStep("verify");
    } catch (err) {
      console.error("Resident signup error:", err);
      const parsed = parseError(err);
      setError(parsed.text);
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = async () => {
    setLoading(true); setError("");
    try {
      await base44.auth.loginViaEmailPassword(pendingEmail, pendingPassword);
      await new Promise(r => setTimeout(r, 800));
      const user = await base44.auth.me();
      if (!user || !user.id) throw new Error("Could not establish session.");
      // Ensure role is set correctly
      if (user.role !== "resident") {
        await base44.auth.updateMe({ role: "resident" });
      }

      const resident = await base44.entities.Resident.create({
        user_id: user.id,
        association_id: selectedAssoc.id,
        first_name: s3.first_name,
        last_name: s3.last_name,
        email: s2.email,
        street_address: s2.street_address,
        unit_number: s2.unit_number,
        city: s2.city,
        state: "FL",
        zip_code: s2.zip_code,
        resident_type: s2.resident_type,
        primary_phone: s2.primary_phone,
        secondary_phone: s2.secondary_phone || "",
        move_in_date: s2.move_in_date || null,
      });
      if (!resident || !resident.id) throw new Error("Account created but resident profile could not be saved. Please log in to continue.");
      setStep("confirmed");
    } catch (err) {
      const msg = err?.message || err?.toString() || "";
      setError(msg && !msg.toLowerCase().includes("object object") ? msg : "Verification succeeded but login failed. Please try logging in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <nav className="bg-navy py-4 px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center">
            <span className="text-navy font-black text-xs">A</span>
          </div>
          <span className="text-white font-bold text-base">ApprovedIn</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
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
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
                {error}
                {(error.includes("already exists") || error.includes("log in")) && (
                  <a href="/signin" className="block mt-2 underline font-semibold text-red-700 hover:text-red-900">Log In →</a>
                )}
              </div>
            )}

            {/* VERIFY: OTP step */}
            {step === "verify" && (
              <OtpStep email={pendingEmail} onVerified={handleVerified} loading={loading} />
            )}

            {/* STEP 1: Find Community */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-navy mb-1">Find your community</h2>
                  <p className="text-body-brown text-sm">Search for your condominium or homeowners association.</p>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3.5 text-body-brown" />
                  <input
                    type="text"
                    placeholder="Search by name, city, or county..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full border border-sand-dark rounded-lg pl-9 pr-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="text-body-brown text-sm text-center py-4">No communities found.</p>
                  ) : (
                    filtered.map(a => (
                      <button key={a.id} onClick={() => { setSelectedAssoc(a); setStep(2); }}
                        className="w-full text-left p-4 border border-sand-dark rounded-xl hover:border-teal hover:bg-teal/5 transition-colors">
                        <p className="text-navy font-semibold text-sm">{a.association_name}</p>
                        <p className="text-body-brown text-xs mt-0.5">{a.city}, {a.florida_county} County · {a.association_type}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Your Unit */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-navy mb-1">Your unit</h2>
                  {selectedAssoc && <p className="text-body-brown text-sm">{selectedAssoc.association_name}</p>}
                </div>

                {/* Street Address */}
                <S2Field label="Street Address *" error={s2Errors.street_address}>
                  <input type="text" value={s2.street_address} onChange={e => setS2({...s2, street_address: e.target.value})}
                    placeholder="123 Ocean Drive" className={inputCls(s2Errors.street_address)} />
                </S2Field>

                {/* Unit / City row */}
                <div className="grid grid-cols-2 gap-3">
                  <S2Field label="Unit / Apt # (optional)">
                    <input type="text" value={s2.unit_number} onChange={e => setS2({...s2, unit_number: e.target.value})}
                      placeholder="e.g. 4B" className={inputCls()} />
                  </S2Field>
                  <S2Field label="City *" error={s2Errors.city}>
                    <input type="text" value={s2.city} onChange={e => setS2({...s2, city: e.target.value})}
                      placeholder="e.g. Miami" className={inputCls(s2Errors.city)} />
                  </S2Field>
                </div>

                {/* State / ZIP row */}
                <div className="grid grid-cols-2 gap-3">
                  <S2Field label="State">
                    <input type="text" value="FL" readOnly tabIndex={-1}
                      className="w-full border border-sand-dark rounded-lg px-4 py-3 text-body-brown text-sm bg-sand cursor-not-allowed select-none pointer-events-none" />
                  </S2Field>
                  <S2Field label="ZIP Code *" error={s2Errors.zip_code}>
                    <input type="text" inputMode="numeric" value={s2.zip_code} maxLength={5}
                      onChange={e => setS2({...s2, zip_code: e.target.value.replace(/\D/g, "").slice(0, 5)})}
                      placeholder="e.g. 33101" className={inputCls(s2Errors.zip_code)} />
                  </S2Field>
                </div>

                {/* Resident / Owner Type */}
                <S2Field label="I am a *" error={s2Errors.resident_type}>
                  <select value={s2.resident_type} onChange={e => setS2({...s2, resident_type: e.target.value})}
                    className={inputCls(s2Errors.resident_type)}>
                    <option value="">Select...</option>
                    {[
                      "Unit Owner","Co-Owner","Shareholder (Co-op)","Slip Owner (Dockominium)",
                      "Lot Owner / Mobile Home Owner","Homeowner","Tenant / Renter","Authorized Occupant",
                      "Sublessee","Live-aboard Resident","Investor Owner (non-occupying)",
                      "Estate / Trust Representative","Corporate Owner Representative",
                      "Property Manager","Board Member","Developer / Builder Owner"
                    ].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </S2Field>

                {/* Phone row */}
                <div className="grid grid-cols-2 gap-3">
                  <S2Field label="Primary Phone *" error={s2Errors.primary_phone}>
                    <input type="tel" value={s2.primary_phone} onChange={e => setS2({...s2, primary_phone: e.target.value})}
                      placeholder="(305) 555-0100" className={inputCls(s2Errors.primary_phone)} />
                  </S2Field>
                  <S2Field label="Secondary Phone (optional)">
                    <input type="tel" value={s2.secondary_phone} onChange={e => setS2({...s2, secondary_phone: e.target.value})}
                      placeholder="(786) 555-0200" className={inputCls()} />
                  </S2Field>
                </div>

                {/* Email */}
                <S2Field label="Email Address *" error={s2Errors.email}>
                  <input type="email" value={s2.email} onChange={e => setS2({...s2, email: e.target.value})}
                    placeholder="you@example.com" className={inputCls(s2Errors.email)} />
                </S2Field>

                {/* Move-in Date */}
                <S2Field label="Move-in Date (optional)">
                  <input type="date" value={s2.move_in_date} onChange={e => setS2({...s2, move_in_date: e.target.value})}
                    className={inputCls()} />
                </S2Field>

                <button type="button" onClick={handleAdvanceStep2}
                  className="w-full bg-navy text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-navy-mid transition-colors mt-2">
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 3: Create Account */}
            {step === 3 && (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <h2 className="text-2xl font-black text-navy mb-4">Create your account</h2>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="First Name *" error={fieldErrors.first_name}>
                    <input type="text" value={s3.first_name} onChange={e => setS3({...s3, first_name: e.target.value})} placeholder="Jane" className={inputCls(fieldErrors.first_name)} />
                  </FormField>
                  <FormField label="Last Name *" error={fieldErrors.last_name}>
                    <input type="text" value={s3.last_name} onChange={e => setS3({...s3, last_name: e.target.value})} placeholder="Smith" className={inputCls(fieldErrors.last_name)} />
                  </FormField>
                </div>

                <FormField label="Password * (min 8 characters)" error={fieldErrors.password}>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={s3.password} onChange={e => setS3({...s3, password: e.target.value})} className={inputCls(fieldErrors.password)} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-body-brown hover:text-navy">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormField>
                <FormField label="Confirm Password *" error={fieldErrors.confirm_password}>
                  <div className="relative">
                    <input type={showPw2 ? "text" : "password"} value={s3.confirm_password} onChange={e => setS3({...s3, confirm_password: e.target.value})} className={inputCls(fieldErrors.confirm_password)} />
                    <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-3 text-body-brown hover:text-navy">
                      {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormField>

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={s3.tos} onChange={e => setS3({...s3, tos: e.target.checked})} className="mt-0.5 accent-teal" />
                    <span className="text-sm text-body-brown">I agree to the <a href="/terms" className="text-teal-dark underline" target="_blank">Terms of Service</a> and <a href="/privacy" className="text-teal-dark underline" target="_blank">Privacy Policy</a></span>
                  </label>
                  {fieldErrors.tos && <p className="text-red-600 text-xs mt-1">{fieldErrors.tos}</p>}
                </div>

                <button type="submit" disabled={loading} className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? "Creating account..." : <>Complete Signup <ChevronRight size={16} /></>}
                </button>
                <p className="text-center text-body-brown text-xs pt-1">
                  Already have an account? <Link to="/signin" className="text-teal-dark font-semibold hover:underline">Log In</Link>
                </p>
              </form>
            )}

            {/* CONFIRMED */}
            {step === "confirmed" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-teal-dark" />
                </div>
                <h2 className="text-2xl font-black text-navy">Welcome to ApprovedIn.</h2>
                <p className="text-body-brown text-sm leading-relaxed">
                  Your profile has been created. Your community administrator will verify your residency shortly.
                </p>
                <a href="/portal/resident/dashboard" className="inline-flex items-center gap-2 bg-navy text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-navy-mid transition-colors">
                  Go to Dashboard <ChevronRight size={16} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OtpStep({ email, onVerified, loading }) {
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true); setError("");
    try {
      await base44.auth.verifyOtp({ email, otpCode: otp });
      await onVerified();
    } catch (err) {
      const msg = err?.message || err?.toString() || "";
      setError(msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")
        ? "Invalid or expired code. Please try again or request a new one."
        : "Verification failed. Please try again.");
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true); setResent(false); setError("");
    try { await base44.auth.resendOtp(email); setResent(true); }
    catch { setError("Could not resend code. Please try again."); }
    finally { setResending(false); }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={24} className="text-teal-dark" />
        </div>
        <h2 className="text-2xl font-black text-navy mb-2">Check your email</h2>
        <p className="text-body-brown text-sm">We sent a 6-digit code to <strong>{email}</strong>. Enter it below to activate your account.</p>
      </div>
      {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {resent && <div className="bg-teal/5 border border-teal/20 text-teal-dark text-sm px-4 py-3 rounded-lg">A new code has been sent.</div>}
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-navy font-medium text-sm mb-1.5">Verification code</label>
          <input type="text" inputMode="numeric" maxLength={6} value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} required autoFocus
            placeholder="123456"
            className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-xl text-center tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white" />
        </div>
        <button type="submit" disabled={verifying || loading || otp.length < 6}
          className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
          {verifying || loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </form>
      <div className="text-center">
        <p className="text-body-brown text-sm">Didn't receive the email?</p>
        <button onClick={handleResend} disabled={resending}
          className="text-teal-dark text-sm font-semibold hover:underline mt-1 disabled:opacity-60">
          {resending ? "Sending..." : "Resend code"}
        </button>
      </div>
    </div>
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