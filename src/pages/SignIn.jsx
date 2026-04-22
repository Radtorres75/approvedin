import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await base44.auth.login(email, password);
      const user = await base44.auth.me();
      if (user.role === "association_manager") navigate("/portal/association");
      else if (user.role === "vendor") navigate("/portal/vendor");
      else if (user.role === "resident") navigate("/portal/resident/dashboard");
      else navigate("/");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <nav className="bg-navy py-4 px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center">
            <span className="text-navy font-black text-xs">A</span>
          </div>
          <span className="text-white font-bold text-base">ApprovedIn</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-sand-dark p-8 w-full max-w-md">
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
              <label className="block text-navy font-medium text-sm mb-1.5">Password</label>
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
              Don't have an account yet?
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Link to="/onboarding" className="border border-sand-dark text-navy font-medium py-2 px-2 rounded-lg hover:bg-sand text-center transition-colors">Association</Link>
              <Link to="/portal/vendor/setup" className="border border-sand-dark text-navy font-medium py-2 px-2 rounded-lg hover:bg-sand text-center transition-colors">Vendor</Link>
              <Link to="/resident/signup" className="border border-sand-dark text-navy font-medium py-2 px-2 rounded-lg hover:bg-sand text-center transition-colors">Resident</Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-navy py-4 px-6 text-center">
        <p className="text-white/30 text-xs">© 2026 ApprovedIn. All Rights Reserved.</p>
      </footer>
    </div>
  );
}