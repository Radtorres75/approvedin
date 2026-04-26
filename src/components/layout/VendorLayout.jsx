import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, FileText, Building2, User, Settings, LogOut, Menu, X, ChevronRight
} from "lucide-react";

const NAV = [
  { path: "/portal/vendor", label: "Dashboard", icon: LayoutDashboard },
  { path: "/portal/vendor/documents", label: "My Documents", icon: FileText },
  { path: "/portal/vendor/associations", label: "Associations", icon: Building2 },
  { path: "/portal/vendor/profile", label: "Profile", icon: User },
  { path: "/portal/vendor/settings", label: "Settings", icon: Settings },
];

export default function VendorLayout({ children, title }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-navy-light">
        <Link to="/" className="flex items-center">
          <img src="https://media.base44.com/images/public/69e9180b18cbe750b3daf184/84825af07_604f35b18_approvedin-logo2.png" alt="ApprovedIn" style={{ height: 36 }} className="w-auto object-contain" />
        </Link>
        <p className="text-white/40 text-xs mt-2 font-medium uppercase tracking-wider">Vendor Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-teal text-navy" : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon size={18} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-navy-light">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream flex">
      <aside className="hidden md:flex flex-col w-64 bg-navy fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-navy flex flex-col">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-sand-dark sticky top-0 z-30 px-4 sm:px-6 h-16 flex items-center">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 text-navy hover:bg-sand rounded-lg mr-3">
            <Menu size={20} />
          </button>
          <h1 className="text-navy font-bold text-base truncate">{title}</h1>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy border-t border-navy-light z-30">
          <div className="flex">
            {NAV.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                    active ? "text-teal" : "text-white/50"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[10px] truncate">{item.label.split(" ")[0]}</span>
                </Link>
              );
            })}
            <button onClick={handleLogout} className="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs text-white/50">
              <LogOut size={18} />
              <span className="text-[10px]">Out</span>
            </button>
          </div>
        </nav>
        <div className="md:hidden h-16" />
      </div>
    </div>
  );
}