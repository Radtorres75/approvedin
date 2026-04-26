import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronRight } from "lucide-react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("login"); // "login" | "forgot" | "forgot_sent"
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      const user = await base44.auth.me();

      if (!user) {
        throw new Error("Session could not be established. Please try again.");
      }

      // Route by profile entity (most reliable — doesn't depend on role field)
      try {
        const assocs = await base44.entities.Association.filter({ user_id: user.id });
        if (assocs.length > 0) {
          navigate(assocs[0].onboarding_complete ? "/portal/association" : "/onboarding", { replace: true });
          return;
        }
      } catch {}

      try {
        const vendors = await base44.entities.Vendor.filter({ user_id: user.id });
        if (vendors.length > 0) {
          navigate(vendors[0].setup_highest_completed_step >= 8 ? "/portal/vendor" : "/portal/vendor/setup", { replace: true });
          return;
        }
      } catch {}

      try {
        const residents = await base44.entities.Resident.filter({ user_id: user.id });
        if (residents.length > 0) {
          navigate("/portal/resident/dashboard", { replace: true });
          return;
        }
      } catch {}

      setError("Your account was found but your profile is incomplete. Please sign up again or contact support@approvedin.com");
    } catch (err) {
      console.error("Login error:", err);
      const msg = err?.message || err?.error || err?.toString() || "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials") || msg.toLowerCase().includes("password") || msg.toLowerCase().includes("not found")) {
        setError("Invalid email or password. Please try again.");
      } else if (msg) {
        setError(msg);
      } else {
        setError("Could not sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    try {
      await base44.auth.resetPasswordRequest(resetEmail);
      setView("forgot_sent");
    } catch (err) {
      console.error("Reset error:", err);
      setResetError("Could not send reset email. Please check the address and try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <nav className="bg-navy py-4 px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src="https://media.base44.com/images/public/69e9180b18cbe750b3daf184/9a7ce84a1_approvedin-logo-nav-transparent.png"
            alt="ApprovedIn"
            style={{ height: "36px", width: "auto", objectFit: "contain", display: "block" }}
          />
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-sand-dark p-8 w-full max-w-md">

          {/* LOGIN VIEW */}
          {view === "login" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-navy mb-2">Welcome back</h1>
                <p className="text-body-brown text-sm">Sign in to your ApprovedIn account</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-navy font-medium text-sm">Password</label>
                    <button
                      type="button"
                      onClick={() => { setResetEmail(email); setView("forgot"); setResetError(""); }}
                      className="text-xs text-teal-dark hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Log In"}
                </button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <p className="text-body-brown text-sm">
                  Don't have an account yet?{" "}
                  <span
                    onClick={() => window.location.href = "/"}
                    className="text-teal-dark font-semibold cursor-pointer underline"
                  >
                    Sign up here
                  </span>
                </p>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === "forgot" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-navy mb-2">Reset your password</h1>
                <p className="text-body-brown text-sm">Enter your email and we'll send a reset link.</p>
              </div>

              {resetError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {resetLoading ? "Sending..." : <>Send Reset Link <ChevronRight size={16} /></>}
                </button>
              </form>

              <button
                onClick={() => setView("login")}
                className="w-full mt-4 text-sm text-body-brown hover:text-navy transition-colors text-center"
              >
                ← Back to Log In
              </button>
            </>
          )}

          {/* RESET SENT VIEW */}
          {view === "forgot_sent" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <h2 className="text-xl font-black text-navy mb-2">Check your email</h2>
              <p className="text-body-brown text-sm mb-6">
                If an account exists for <strong>{resetEmail}</strong>, a password reset link has been sent.
              </p>
              <button
                onClick={() => setView("login")}
                className="w-full bg-navy hover:bg-navy-mid text-white font-bold py-3 rounded-lg text-sm transition-colors"
              >
                Back to Log In
              </button>
            </div>
          )}

        </div>
      </div>

      <footer className="bg-navy py-4 px-6 text-center">
        <p className="text-white/30 text-xs">© 2026 ApprovedIn. All Rights Reserved.</p>
      </footer>
    </div>
  );
}