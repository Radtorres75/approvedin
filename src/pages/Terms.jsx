import React from "react";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-cream">
      <PublicNav />
      <section className="bg-navy text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-black mb-2">Terms of Service</h1>
        <p className="text-white/60 text-sm">Last updated: January 1, 2026</p>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-sand-dark p-8 sm:p-10 space-y-8 text-body-brown text-sm leading-relaxed">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-900 font-semibold text-sm">Platform Disclaimer</p>
            <p className="text-amber-800 text-sm mt-1">ApprovedIn is a technology platform only. We do not provide insurance advice, legal advice, or any professional advice of any kind. We facilitate a pre-screening process that allows vendors to submit compliance documents for association review. ApprovedIn does not verify document authenticity and assumes no liability for vendor work or any outcome of the vendor-client relationship. All vendor approvals are made solely by each association.</p>
          </div>
          <Section title="1. Acceptance of Terms">
            By creating an account or using the ApprovedIn platform, you agree to these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not use the Platform.
          </Section>
          <Section title="2. Platform Description">
            ApprovedIn is a technology platform that facilitates the management of vendor compliance documents for Florida community associations. The Platform allows associations to manage vendor compliance requirements, vendors to submit compliance documents, and residents to browse approved vendor directories. We do not employ, endorse, or guarantee any vendor listed on the Platform.
          </Section>
          <Section title="3. User Responsibilities">
            You are solely responsible for the accuracy and completeness of all information you provide on the Platform, including compliance documents, contact information, and business details. Vendors are solely responsible for maintaining valid, current insurance and licenses. Submitting false, expired, or fraudulent documents is a violation of these Terms and may result in immediate account termination and legal liability.
          </Section>
          <Section title="4. No Verification of Documents">
            ApprovedIn does not independently verify the authenticity, accuracy, validity, or currency of any compliance document uploaded to the Platform. The Platform facilitates document submission and storage only. Associations are solely responsible for their own vendor approval decisions.
          </Section>
          <Section title="5. Subscription and Billing">
            Association and resident accounts are free and do not require payment. Vendor accounts are available on a subscription basis. During the beta period, vendor access is free for up to 6 months from the vendor's signup date. After the beta period, vendors are required to maintain a paid subscription at the then-current rate (currently $19/month) to maintain platform access.<br /><br />
            <strong>All subscription fees are non-refundable.</strong> Pricing is subject to change. Beta subscribers will receive advance notice before any paid tier activates.
          </Section>
          <Section title="6. Acceptable Use">
            You agree not to: use the Platform for any unlawful purpose; upload fraudulent, false, or misleading documents; impersonate any person or entity; attempt to gain unauthorized access to any part of the Platform; use the Platform to spam or harass other users; or interfere with the proper operation of the Platform.
          </Section>
          <Section title="7. Termination">
            We reserve the right to suspend or terminate any account at any time for violation of these Terms. Vendors may also be suspended automatically if their compliance documents expire. You may close your account at any time by contacting us. Termination of your account does not entitle you to any refund of subscription fees paid.
          </Section>
          <Section title="8. Limitation of Liability">
            To the maximum extent permitted by law, ApprovedIn shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform or any vendor-client relationship facilitated through the Platform. Our total liability to you for any claim shall not exceed the amount you paid to us in the 12 months preceding the claim.
          </Section>
          <Section title="9. Governing Law">
            These Terms are governed by the laws of the State of Florida, without regard to its conflict of law provisions. Any disputes shall be resolved in the state or federal courts located in Florida.
          </Section>
          <Section title="10. Contact">
            For questions about these Terms, contact us at:<br />
            ApprovedIn<br />
            legal@approvedin.com
          </Section>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-navy font-bold text-base mb-3">{title}</h2>
      <p>{children}</p>
    </div>
  );
}