import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";
import { Bell, CheckCheck } from "lucide-react";

const NAV = [
  { path: "/portal/resident/dashboard", label: "Home" },
  { path: "/portal/resident/vendors", label: "Find Vendors" },
  { path: "/portal/resident/profile", label: "Profile" },
  { path: "/portal/resident/notifications", label: "Notifications" },
];

export default function ResidentNotifications() {
  const { loading: authLoading, user } = useRoleGuard("resident");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const notifs = await base44.entities.Notification.filter({ user_id: user.id });
    setNotifications(notifs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  const markRead = async (n) => {
    if (!n.is_read) {
      await base44.entities.Notification.update(n.id, { is_read: true });
      setNotifications(prev => prev.map(x => x.id === n.id ? {...x, is_read: true} : x));
    }
  };

  const markAllRead = async () => {
    for (const n of notifications.filter(x => !x.is_read)) {
      await base44.entities.Notification.update(n.id, { is_read: true });
    }
    setNotifications(prev => prev.map(n => ({...n, is_read: true})));
  };

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <PortalLayout navItems={NAV} portalName="Resident" userRole="resident">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-navy">Notifications</h1>
            {unread > 0 && <p className="text-body-brown text-sm mt-0.5">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-teal-dark text-sm font-semibold hover:underline">
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sand-dark p-12 text-center">
            <Bell size={32} className="text-sand-dark mx-auto mb-3" />
            <p className="text-body-brown text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n)}
                className={`bg-white rounded-xl border p-5 cursor-pointer hover:shadow-sm transition-all ${!n.is_read ? "border-teal/30 bg-teal/5" : "border-sand-dark"}`}
              >
                <div className="flex items-start gap-3">
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-teal flex-shrink-0 mt-1.5" />}
                  <div className="flex-1">
                    <p className="text-navy font-semibold text-sm">{n.title}</p>
                    <p className="text-body-brown text-sm mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-body-brown/60 text-xs mt-2">{new Date(n.created_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}