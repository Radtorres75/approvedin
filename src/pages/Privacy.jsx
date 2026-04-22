import React from "react";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-cream">
      <PublicNav />
      <section className="bg-navy text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-black mb-2">Privacy Policy</h1>
        <p className="text-white/60 text-sm">Last updated: January 1, 2026</p>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-sand-dark p-8 sm:p-10 space-y-8 text-body-brown text-sm leading-relaxed">
          <Section title="1. Introduction">
            ApprovedIn ("we," "us," or "our") operates a technology platform that connects Florida community associations, vendors, and residents. This Privacy Policy explains how we collect, use, disclose, and protect information about users of our platform located at approvedin.com and related services (collectively, the "Platform"). By using the Platform, you agree to the collection and use of information as described in this policy.
          </Section>
          <Section title="2. Information We Collect">
            <strong>From Association Managers:</strong> Name, email address, password, phone number, association name and details, compliance requirements, subscription information, and usage activity on the Platform.<br /><br />
            <strong>From Vendors:</strong> Business name, description, phone number, email address, website, trade categories, counties served, compliance documents (COIs, trade licenses, workers compensation, corporate filings), file uploads, subscription tier, payment information (where applicable), and usage activity.<br /><br />
            <strong>From Residents:</strong> Name, email address, phone number, unit number, address, association affiliation, resident type (owner or tenant), and usage activity.<br /><br />
            <strong>Automatically:</strong> IP address, browser type, device information, pages visited, time and date of visits, and other usage data collected through standard web analytics tools.
          </Section>
          <Section title="3. How We Use Your Information">
            We use the information we collect to: operate and maintain the Platform; verify account identity and prevent fraud; match vendors with associations; process and store compliance documents; send automated expiration reminders and notifications; respond to support inquiries; improve our services; comply with legal obligations; and enforce our Terms of Service.
          </Section>
          <Section title="4. How We Share Your Information">
            <strong>With other users on the Platform:</strong> Association managers can view vendor compliance documents and contact information. Vendors can view association contact information and compliance requirements. Residents can view approved vendor contact information. This sharing is integral to the Platform's purpose.<br /><br />
            <strong>With service providers:</strong> We share information with third-party service providers who assist us in operating the Platform, subject to confidentiality agreements.<br /><br />
            <strong>We do not sell your personal information to third parties.</strong> We will never sell, rent, or trade your personal information to advertisers, data brokers, or any other third parties.<br /><br />
            <strong>As required by law:</strong> We may disclose information if required by law, subpoena, or other legal process.
          </Section>
          <Section title="5. Florida FIPA Compliance">
            We comply with the Florida Information Protection Act (FIPA). In the event of a data breach involving personal information of Florida residents, we will notify affected individuals and the Florida Department of Legal Affairs within the timeframes required by law.
          </Section>
          <Section title="6. Data Retention">
            We retain your account information for as long as your account is active or as needed to provide services. Compliance documents are retained for the duration of your account. You may request deletion of your account and associated data at any time.
          </Section>
          <Section title="7. Your Rights">
            You have the right to: access the personal information we hold about you; correct inaccurate information; request deletion of your account and personal data; export your data; and opt out of marketing communications. To exercise these rights, contact us at privacy@approvedin.com.
          </Section>
          <Section title="8. Security">
            We implement commercially reasonable security measures to protect your information, including encryption in transit and at rest, access controls, and regular security reviews. However, no system is completely secure, and we cannot guarantee absolute security.
          </Section>
          <Section title="9. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify users of material changes by email or prominent notice on the Platform. Your continued use of the Platform after changes constitutes acceptance of the updated policy.
          </Section>
          <Section title="10. Contact">
            For privacy-related questions or requests, contact us at:<br />
            ApprovedIn<br />
            privacy@approvedin.com
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