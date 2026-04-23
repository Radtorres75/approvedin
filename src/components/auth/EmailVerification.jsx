import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck } from "lucide-react";

export default function EmailVerification({ email, onVerified }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await base44.auth.verifyOtp({ email, otpCode: otp });
      onVerified();
    } catch (err) {
      const msg = err?.message || err?.toString() || "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
        setError("Invalid or expired code. Please try again or request a new one.");
      } else if (msg) {
        setError(msg);
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    setError("");
    try {
      await base44.auth.resendOtp(email);
      setResent(true);
    } catch {
      setError("Could not resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={24} className="text-teal-dark" />
        </div>
        <h2 className="text-2xl font-black text-navy mb-2">Verify your email</h2>
        <p className="text-body-brown text-sm">
          We sent a 6-digit code to <strong>{email}</strong>.<br />
          Enter it below to continue.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {resent && (
        <div className="bg-teal/5 border border-teal/20 text-teal-dark text-sm px-4 py-3 rounded-lg">
          A new code has been sent to {email}.
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-navy font-medium text-sm mb-1.5">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            autoFocus
            placeholder="123456"
            className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-lg text-center tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading || otp.length < 6}
          className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </form>

      <div className="text-center">
        <p className="text-body-brown text-sm">Didn't receive the email?</p>
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-teal-dark text-sm font-semibold hover:underline mt-1 disabled:opacity-60"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </div>
    </div>
  );
}