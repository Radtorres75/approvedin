import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ResidentLayout from "@/components/layout/ResidentLayout";
import { RefreshCw, Bell } from "lucide-react";

export default function ResidentNotificationsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => { loadPage(); }, []);

  const loadPage = async () => {
    try {
      setLoading(true); setError(null);
      const currentUser = await base44.auth.me();
      if (!currentUser) { navigate("/signin"); return; }
      if (currentUser.role !== "resident") { navigate("/signin"); return; }
      setUserId(currentUser.id);
      const residents = await base44.entities.Resident.filter({ user_id: currentUser.id });
      if (!residents?.length) { navigate("/resident/signup"); return; }

      const notifs = await base44.entities.Notification.filter({ user_id: currentUser.id });
      setNotifications(notifs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (err) {
      setError("Could not load notifications. Please try again.");
    } finally { setLoading(false); }
  };

  const handleClick = async (notif) => {
    if (!notif.is_read) {
      await base44.entities.Notification.update(notif.id, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.action_url) navigate(notif.action_url);
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) return <ResidentLayout title="Notifications"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" /></div></ResidentLayout>;
  if (error) return <ResidentLayout title="Notifications"><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-red-600">{error}</p><button onClick={loadPage} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm"><RefreshCw size={14} /> Retry</button></div></ResidentLayout>;

  return (
    <ResidentLayout title="Notifications">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-navy">Notifications</h2>
            {unreadCount > 0 && <p className="text-body-brown text-sm">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-teal-dark text-sm font-semibold hover:underline">
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sand-dark p-12 text-center">
            <Bell size={36} className="text-sand-dark mx-auto mb-3" />
            <p className="text-body-brown text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-sand-dark overflow-hidden">
            {notifications.map((notif, idx) => (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-cream transition-colors ${idx < notifications.length - 1 ? "border-b border-sand" : ""} ${!notif.is_read ? "bg-teal/5" : ""}`}
              >
                {!notif.is_read && <div className="w-2 h-2 bg-teal rounded-full mt-2 flex-shrink-0" />}
                {notif.is_read && <div className="w-2 h-2 mt-2 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.is_read ? "font-bold text-navy" : "font-semibold text-navy"}`}>
                    {notif.title}
                  </p>
                  <p className="text-body-brown text-sm mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-body-brown/60 text-xs mt-1">{formatTime(notif.created_date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ResidentLayout>
  );
}