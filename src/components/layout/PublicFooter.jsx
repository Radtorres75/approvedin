import React from "react";
import { Link } from "react-router-dom";

export default function PublicFooter() {
  return (
    <footer className="bg-navy text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <img src="https://media.base44.com/images/public/69e9180b18cbe750b3daf184/84825af07_604f35b18_approvedin-logo2.png" alt="ApprovedIn" style={{ height: 36 }} className="w-auto object-contain" />
            </div>
            <p className="text-sm leading-relaxed">
              Compliance is the product.<br />Community is the platform.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/associations" className="hover:text-white transition-colors">For Associations</Link></li>
              <li><Link to="/vendors" className="hover:text-white transition-colors">For Vendors</Link></li>
              <li><Link to="/residents" className="hover:text-white transition-colors">For Residents</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8">
          <p className="text-xs text-white/40 leading-relaxed mb-3">ApprovedIn, LLC. is a technology platform only. We do not provide insurance advice, legal advice, or any professional advice of any kind. We facilitate a pre-screening process that allows vendors to submit compliance documents for association review. ApprovedIn does not verify document authenticity and assumes no liability for vendor work or any outcome of the vendor-client relationship. All vendor approvals are made solely by each association.

          </p>
          <p className="text-xs text-white/40">© 2026 ApprovedIn, LLC. All Rights Reserved.

          </p>
        </div>
      </div>
    </footer>);

}