import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bell, LogOut, Menu, X, ChevronDown } from "lucide-react";

export default function PortalLayout({ children, navItems, portalName, userRole }) {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bellRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const notifs = await base44.entities.Notification.filter({ user_id: user.id });
        setNotifications(notifs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      } catch {}
    };
    load();
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_id === user.id) {
        setNotifications(prev => {
          if (event.type === "create") return [event.data, ...prev];
          if (event.type === "update") return prev.map(n => n.id === event.id ? event.data : n);
          if (event.type === "delete") return prev.filter(n => n.id !== event.id);
          return prev;
        });
      }
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  const markRead = async (notif) => {
    if (!notif.is_read) {
      await base44.entities.Notification.update(notif.id, { is_read: true });
    }
    if (notif.action_url) navigate(notif.action_url);
    setBellOpen(false);
  };

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top Nav */}
      <nav className="bg-navy sticky top-0 z-50 border-b border-navy-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center">
                  <span className="text-navy font-black text-xs">A</span>
                </div>
                <span className="text-white font-bold text-base tracking-tight">ApprovedIn</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Bell */}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen(!bellOpen)}
                  className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Bell size={18} />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-teal text-navy text-xs font-bold rounded-full flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-sand-dark z-[9999]"
                    style={{ minWidth: 340, maxHeight: 480, overflowY: "auto" }}>
                    <div className="sticky top-0 bg-white border-b border-sand-dark px-4 py-3 flex items-center justify-between rounded-t-xl">
                      <span className="font-semibold text-navy text-sm">Notifications</span>
                      {unread > 0 && <span className="text-xs text-body-brown">{unread} unread</span>}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-body-brown text-sm">No notifications yet.</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n)}
                          className={`px-4 py-3 border-b border-sand cursor-pointer hover:bg-cream transition-colors ${!n.is_read ? "bg-teal/5" : ""}`}
                        >
                          <div className="flex items-start gap-2">
                            {!n.is_read && <div className="w-2 h-2 bg-teal rounded-full mt-1.5 flex-shrink-0" />}
                            <div>
                              <p className="text-sm font-semibold text-navy">{n.title}</p>
                              <p className="text-xs text-body-brown mt-0.5 leading-relaxed">{n.message}</p>
                              <p className="text-xs text-body-brown/60 mt-1">
                                {new Date(n.created_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors px-2 py-2"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-white/70 hover:text-white"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden bg-navy-mid border-t border-navy-light px-4 py-3 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="bg-navy border-t border-navy-light py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-white/30 leading-relaxed mb-2">
            ApprovedIn is a technology platform only. We do not provide insurance advice, legal advice, or any professional advice of any kind. We facilitate a pre-screening process that allows vendors to submit compliance documents for association review. ApprovedIn does not verify document authenticity and assumes no liability for vendor work or any outcome of the vendor-client relationship. All vendor approvals are made solely by each association.
          </p>
          <p className="text-xs text-white/30">© 2026 ApprovedIn. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}