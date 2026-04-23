import React, { useState } from "react";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";
import { base44 } from "@/api/base44Client";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true); setError("");
    try {
      // Save to DB first (always works, no external service needed)
      await base44.entities.ContactSubmission.create({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        status: "pending",
      });
      // Send email via Resend backend function
      try {
        await base44.functions.invoke("sendContactEmail", {
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        });
      } catch {
        // Email failed but DB record was saved — still show success
      }
      setSent(true);
    } catch {
      setError("We could not send your message right now. Please email us directly at support@approvedin.com");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <PublicNav />
      <section className="bg-navy text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-black mb-3">Contact Us</h1>
        <p className="text-white/70">We're here to help. Expect a response within 1–2 business days.</p>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-sand-dark p-8">
          {sent ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✓</div>
              <h2 className="text-navy font-black text-xl mb-2">Message sent!</h2>
              <p className="text-body-brown text-sm">We'll get back to you within 1–2 business days at {form.email}.</p>
            </div>
          ) : (
            <>
              {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-navy font-medium text-sm mb-1.5">Name *</label>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                  </div>
                  <div>
                    <label className="block text-navy font-medium text-sm mb-1.5">Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Subject *</label>
                  <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
                    <option value="">Select a subject...</option>
                    <option>General Question</option>
                    <option>Association Account</option>
                    <option>Vendor Account</option>
                    <option>Resident Account</option>
                    <option>Technical Issue</option>
                    <option>Billing</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Message *</label>
                  <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} required className="w-full border border-sand-dark rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none h-32" />
                </div>
                <button type="submit" disabled={sending} className="w-full bg-navy text-white font-bold py-3 rounded-xl text-sm hover:bg-navy-mid transition-colors disabled:opacity-60">
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
              <p className="text-body-brown text-xs text-center mt-4">Or email us directly: <a href="mailto:support@approvedin.com" className="text-teal-dark">support@approvedin.com</a></p>
            </>
          )}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}