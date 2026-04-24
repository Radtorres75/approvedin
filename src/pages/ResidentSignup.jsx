import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, ChevronRight, Search, Eye, EyeOff, ShieldCheck } from "lucide-react";
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
  const [s2, setS2] = useState({ unit_number: "", resident_type: "" });
  const [s3, setS3] = useState({ first_name: "", last_name: "", email: "", phone_number: "", address: "", password: "", confirm_password: "", tos: false });

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

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!s3.tos) { setError("Please accept the Terms of Service."); return; }
    if (s3.password.length < 8) { setError("Your password must be at least 8 characters."); return; }
    if (s3.password !== s3.confirm_password) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    try {
      await base44.auth.register({
        email: s3.email,
        password: s3.password,
        first_name: s3.first_name,
        last_name: s3.last_name,
        role: "resident",
      });
      setPendingEmail(s3.email);
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
        email: s3.email,
        phone_number: s3.phone_number,
        address: s3.address,
        unit_number: s2.unit_number,
        resident_type: s2.resident_type,
      });
      if (!resident || !resident.id) throw new Error("Account created but resident profile could not be saved. Please log in to continue.");
      window.location.href = "/portal/resident/dashboard";
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
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black text-navy mb-1">Your unit</h2>
                  {selectedAssoc && <p className="text-body-brown text-sm">{selectedAssoc.association_name}</p>}
                </div>
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Unit number *</label>
                  <input type="text" value={s2.unit_number} onChange={e => setS2({...s2, unit_number: e.target.value})}
                    className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" placeholder="e.g. 4B, 201, Unit 12" />
                </div>
                <div>
                  <label className="block text-navy font-medium text-sm mb-2">Resident type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ val: "owner", label: "🏠 Owner", desc: "Unit owner" }, { val: "tenant", label: "🔑 Tenant", desc: "Renter / tenant" }].map(opt => (
                      <button key={opt.val} type="button" onClick={() => setS2({...s2, resident_type: opt.val})}
                        className={`py-4 rounded-xl border-2 font-medium text-sm transition-colors ${s2.resident_type === opt.val ? "border-teal bg-teal/5 text-navy" : "border-sand-dark text-body-brown hover:border-teal/30"}`}>
                        <div>{opt.label}</div>
                        <div className="text-xs mt-0.5 font-normal">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => { if (!s2.unit_number || !s2.resident_type) { setError("Please fill in all fields."); return; } setError(""); setStep(3); }}
                  className="w-full bg-navy text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-navy-mid transition-colors">
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 3: Create Account */}
            {step === 3 && (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <h2 className="text-2xl font-black text-navy mb-4">Create your account</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name *" value={s3.first_name} onChange={v => setS3({...s3, first_name: v})} required />
                  <Field label="Last name *" value={s3.last_name} onChange={v => setS3({...s3, last_name: v})} required />
                </div>
                <Field label="Email *" type="email" value={s3.email} onChange={v => setS3({...s3, email: v})} required />
                <Field label="Phone number *" value={s3.phone_number} onChange={v => setS3({...s3, phone_number: v})} required />
                <Field label="Address *" value={s3.address} onChange={v => setS3({...s3, address: v})} required />
                <div className="relative">
                  <Field label="Password * (min 8 characters)" type={showPw ? "text" : "password"} value={s3.password} onChange={v => setS3({...s3, password: v})} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-8 text-body-brown hover:text-navy">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <Field label="Confirm password *" type={showPw2 ? "text" : "password"} value={s3.confirm_password} onChange={v => setS3({...s3, confirm_password: v})} required />
                  <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-8 text-body-brown hover:text-navy">
                    {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={s3.tos} onChange={e => setS3({...s3, tos: e.target.checked})} className="mt-0.5 accent-teal" required />
                  <span className="text-sm text-body-brown">I agree to the <a href="/terms" className="text-teal-dark underline" target="_blank">Terms of Service</a> and <a href="/privacy" className="text-teal-dark underline" target="_blank">Privacy Policy</a></span>
                </label>
                <button type="submit" disabled={loading} className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? "Creating account..." : <>Complete Signup <ChevronRight size={16} /></>}
                </button>
                <p className="text-center text-body-brown text-xs pt-1">
                  Already have an account? <Link to="/signin" className="text-teal-dark font-semibold hover:underline">Log In</Link>
                </p>
              </form>
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