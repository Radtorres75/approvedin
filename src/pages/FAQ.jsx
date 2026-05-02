import React, { useState } from "react";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";
import { ChevronDown } from "lucide-react";

const FAQS = {
  associations: [
    { q: "Is ApprovedIn really free for associations?", a: "Yes — completely free, forever. No credit card, no trial period, no feature caps, no paid tiers for associations ever. ApprovedIn is funded through vendor access fees, not association fees." },
    { q: "How do I add vendors to my directory?", a: "You can invite vendors directly by email or SMS from the Vendor Directory page. You can also enable vendor applications so vendors can find your association in the directory and apply to join." },
    { q: "What compliance documents can I require from vendors?", a: "You can require any combination of: Certificate of Insurance (COI), Trade License, Workers Compensation, and Florida Sunbiz Corporate Standing. You can also set a minimum General Liability coverage amount and add custom compliance notes shown to vendors." },
    { q: "What happens when a vendor's document expires?", a: "ApprovedIn automatically suspends the vendor from your directory and notifies both you and the vendor. You'll receive expiration reminders at 90, 60, 30, and 7 days before expiration so you can follow up proactively." },
    { q: "Can a management company manage multiple associations?", a: "Yes. If you manage multiple associations, you can create separate association profiles for each one from the same account." },
    { q: "Do I need to verify residents who sign up?", a: "No. Residents connect to your association automatically on signup — no approval required from you. This keeps the experience friction-free for your residents while giving you a list of who has registered." },
  ],
  vendors: [
    { q: "How much does it cost to join as a vendor?", a: "During our beta period, ApprovedIn is completely free for vendors for up to 6 months from your signup date. After beta, access is $19/month for all features. No commission fees ever. All subscription fees are non-refundable." },
    { q: "What documents do I need to upload?", a: "You'll need to upload your Certificate of Insurance (COI) with General Liability expiration date, Trade License, Workers Compensation policy or exemption, and Florida Sunbiz Corporate Standing document. For some documents, you can select Hold Harmless or Do Not Carry if applicable." },
    { q: "Can I apply to multiple associations?", a: "Yes. You can browse all active associations on the platform and apply to any of them. Each association reviews your application and your compliance documents independently." },
    { q: "What is General Liability and why is it always required?", a: "General Liability insurance protects against bodily injury and property damage claims. It is required for every vendor on ApprovedIn without exception — there is no do-not-carry or hold-harmless option for GL. This is non-negotiable because it is the core protection that Florida associations require from every contractor." },
    { q: "What is 'one-click document distribution'?", a: "One-click document distribution (not applicable for COIs) allows you to share your trade license, workers comp, and Sunbiz documents to all your connected associations simultaneously with a single click. Because each association may require different GL coverage amounts, COIs must be submitted per association." },
    { q: "What happens if my documents expire?", a: "You'll receive automated reminders at 90, 60, 30, and 7 days before expiration. If a document expires without renewal, your account is automatically suspended from all association directories. Upload a renewed document to begin the reinstatement process." },
  ],
  residents: [
    { q: "Is ApprovedIn free for residents?", a: "Yes — free for all residents. No credit card required." },
    { q: "How do I find my association?", a: "During signup, you can search for your condominium or homeowners association by name, city, or county. All active associations registered on ApprovedIn will appear in the search results." },
    { q: "What does 'Association-Approved' mean?", a: "It means the vendor has been reviewed and approved by your association, and their insurance and license documents are on file with ApprovedIn. It does not mean ApprovedIn has independently verified the documents." },
    { q: "Can I see all vendors in Florida, or just my association's?", a: "You can only see vendors that have been approved by your specific association. This ensures the directory reflects your community's specific standards and requirements." },
    { q: "How do I contact a vendor?", a: "Each vendor's phone number and email are displayed directly on their profile card. There is no in-app messaging — contact is handled directly." },
  ],
};

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-sand-dark rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-cream transition-colors">
        <span className="text-navy font-semibold text-sm pr-4">{q}</span>
        <ChevronDown size={16} className={`text-body-brown flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="bg-white border-t border-sand-dark px-4 pb-4 pt-3"><p className="text-body-brown text-sm leading-relaxed">{a}</p></div>}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-cream">
      <PublicNav />
      <section className="bg-navy text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-black mb-3">Frequently Asked Questions</h1>
        <p className="text-white/70">Find answers for associations, vendors, and residents.</p>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          {[
            { key: "associations", title: "For Community Associations & Managers" },
            { key: "vendors", title: "For Vendors & Contractors" },
            { key: "residents", title: "For Residents & Homeowners" },
          ].map(section => (
            <div key={section.key}>
              <h2 className="text-2xl font-black text-navy mb-6">{section.title}</h2>
              <div className="space-y-3">
                {FAQS[section.key].map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
              </div>
            </div>
          ))}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}