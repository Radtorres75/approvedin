import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Home, Users, User, Bell, LogOut, Menu, X } from "lucide-react";

const NAV = [
  { path: "/portal/resident/dashboard", label: "Home", icon: Home },
  { path: "/portal/resident/vendors", label: "Vendors", icon: Users },
  { path: "/portal/resident/profile", label: "Profile", icon: User },
  { path: "/portal/resident/notifications", label: "Alerts", icon: Bell },
];

export default function ResidentLayout({ children, title }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top nav (desktop) */}
      <header className="bg-navy sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center">
                <span className="text-navy font-black text-xs">A</span>
              </div>
              <span className="text-white font-bold hidden sm:block">ApprovedIn</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="hidden md:flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors px-2">
              <LogOut size={16} /> Log Out
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white/60 hover:text-white p-2">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-navy-mid border-t border-navy-light px-4 py-3 space-y-1">
            {NAV.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  location.pathname === item.path ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}>{item.label}</Link>
            ))}
            <button onClick={handleLogout} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white">
              Log Out
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy border-t border-navy-light z-30">
        <div className="flex">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                  active ? "text-teal" : "text-white/50"
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
          <button onClick={handleLogout} className="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs text-white/50">
            <LogOut size={20} />
            <span className="text-[10px]">Out</span>
          </button>
        </div>
      </nav>
    </div>
  );
}