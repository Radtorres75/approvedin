import React from "react";
import { Link } from "react-router-dom";

export default function PublicNav() {
  return (
    <nav className="sticky top-0 z-50 bg-navy border-b border-navy-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
              <span className="text-navy font-black text-sm">A</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">ApprovedIn</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-white/80 hover:text-white text-sm font-medium transition-colors px-4 py-2"
            >
              Log In
            </Link>
            <Link
              to="/"
              className="bg-teal hover:bg-teal-dark text-navy font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}