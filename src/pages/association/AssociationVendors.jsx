import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PortalLayout from "@/components/layout/PortalLayout";
import { useRoleGuard } from "@/lib/authGuard";
import ComplianceBadge from "@/lib/complianceBadge";
import { Search, Mail, Phone, ToggleLeft, ToggleRight, Send, X } from "lucide-react";

const NAV = [
  { path: "/portal/association", label: "Dashboard" },
  { path: "/portal/association/vendors", label: "Vendors" },
  { path: "/portal/association/documents", label: "Documents" },
  { path: "/portal/association/settings", label: "Settings" },
];

export default function AssociationVendors() {
  const { loading: authLoading, user } = useRoleGuard("association_manager");
  const [assoc, setAssoc] = useState(null);
  const [assocVendors, setAssocVendors] = useState([]);
  const [vendors, setVendors] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [inviteModal, setInviteModal] = useState(false);
  const [invite, setInvite] = useState({ email: "", phone: "", method: "email" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const assocs = await base44.entities.Association.list();
    const a = assocs.find(x => x.user_id === user.id) || assocs[0];
    setAssoc(a);
    if (!a) { setLoading(false); return; }
    const avs = await base44.entities.AssociationVendor.filter({ association_id: a.id });
    setAssocVendors(avs);
    const vendorData = {};
    for (const av of avs) {
      const vArr = await base44.entities.Vendor.filter({ id: av.vendor_id });
      if (vArr[0]) vendorData[av.vendor_id] = vArr[0];
    }
    setVendors(vendorData);
    setLoading(false);
  };

  const handleToggle = async (av) => {
    const newStatus = av.status === "approved" ? "suspended" : "approved";
    await base44.entities.AssociationVendor.update(av.id, {
      status: newStatus,
      suspension_reason: newStatus === "suspended" ? "manager_manual" : undefined,
      is_visible_in_resident_directory: newStatus === "approved",
      suspended_date: newStatus === "suspended" ? new Date().toISOString().split("T")[0] : undefined,
    });
    const vendor = vendors[av.vendor_id];
    if (vendor) {
      await base44.entities.Notification.create({
        user_id: vendor.user_id,
        notification_type: newStatus === "suspended" ? "vendor_suspended" : "vendor_reactivated",
        title: newStatus === "suspended" ? `Suspended from ${assoc?.association_name}` : `Reactivated in ${assoc?.association_name}`,
        message: newStatus === "suspended"
          ? `Your vendor account has been suspended from ${assoc?.association_name} by the association manager.`
          : `Your vendor account has been reactivated in ${assoc?.association_name}.`,
        action_url: "/portal/vendor/associations",
        is_read: false,
      });
    }
    loadData();
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true); setInviteMsg("");
    try {
      const link = `${window.location.origin}/portal/vendor/setup?association=${assoc.id}`;
      const inv = await base44.entities.VendorInvitation.create({
        association_id: assoc.id,
        sent_by_user_id: user.id,
        recipient_email: invite.email || null,
        recipient_phone: invite.phone || null,
        invitation_method: invite.method,
        registration_link: link,
        status: "pending",
      });
      const res = await base44.functions.invoke("sendVendorInvitation", { invitation_id: inv.id });
      if (res.data?.success) {
        setInviteMsg("Invitation sent successfully!");
      } else {
        setInviteMsg(`Delivery failed: ${res.data?.error || "Unknown error"}`);
      }
    } catch (err) {
      setInviteMsg(`Error: ${err.message}`);
    } finally {
      setInviteLoading(false);
    }
  };

  const filtered = assocVendors.filter(av => {
    const v = vendors[av.vendor_id];
    if (!v) return false;
    const matchTab = tab === "all" || av.status === tab;
    const matchSearch = !search || v.business_name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  if (authLoading || loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin" />
    </div>
  );

  return (
    <PortalLayout navItems={NAV} portalName="Association" userRole="association_manager">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-navy">Vendor Directory</h1>
          <button onClick={() => setInviteModal(true)} className="flex items-center gap-2 bg-teal text-navy font-bold px-4 py-2 rounded-lg text-sm hover:bg-teal-dark transition-colors">
            <Send size={14} /> Invite Vendor
          </button>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-1 bg-white rounded-xl border border-sand-dark p-1">
            {["all", "approved", "pending", "rejected"].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-navy text-white" : "text-body-brown hover:text-navy"}`}>{t}</button>
            ))}
          </div>
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-2.5 text-body-brown" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="w-full border border-sand-dark rounded-lg pl-8 pr-4 py-2 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white" />
          </div>
        </div>

        {/* Vendor Cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sand-dark p-12 text-center">
            <p className="text-body-brown text-sm">No vendors found.</p>
            <button onClick={() => setInviteModal(true)} className="mt-4 text-teal-dark text-sm font-semibold hover:underline">Invite your first vendor →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(av => {
              const v = vendors[av.vendor_id];
              if (!v) return null;
              return (
                <div key={av.id} className="bg-white rounded-2xl border border-sand-dark p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-navy font-bold text-base">{v.business_name}</h3>
                      <p className="text-body-brown text-xs mt-0.5">{v.trade_categories?.slice(0, 2).join(", ")}</p>
                    </div>
                    <ComplianceBadge status={av.status === "suspended" ? "suspended" : av.status === "approved" ? "active" : av.status === "pending" ? "pending_review" : "expired"} />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    {v.business_phone && <a href={`tel:${v.business_phone}`} className="text-xs text-body-brown flex items-center gap-1 hover:text-teal-dark"><Phone size={12} /> {v.business_phone}</a>}
                    {v.business_email && <a href={`mailto:${v.business_email}`} className="text-xs text-body-brown flex items-center gap-1 hover:text-teal-dark"><Mail size={12} /> Email</a>}
                  </div>
                  {(av.status === "approved" || av.status === "suspended") && (
                    <button onClick={() => handleToggle(av)} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-colors ${av.status === "approved" ? "border-sand-dark text-body-brown hover:bg-red-50 hover:border-red-200 hover:text-red-600" : "border-teal/30 text-teal-dark bg-teal/5 hover:bg-teal/10"}`}>
                      {av.status === "approved" ? <><ToggleRight size={14} /> Active — Click to Suspend</> : <><ToggleLeft size={14} /> Suspended — Click to Reactivate</>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-navy font-bold text-lg">Invite a Vendor</h3>
              <button onClick={() => { setInviteModal(false); setInviteMsg(""); }} className="text-body-brown hover:text-navy"><X size={18} /></button>
            </div>
            {inviteMsg && (
              <div className={`text-sm px-4 py-3 rounded-lg mb-4 ${inviteMsg.includes("success") ? "bg-teal/10 text-teal-dark border border-teal/20" : "bg-red-50 text-red-700 border border-red-100"}`}>
                {inviteMsg}
              </div>
            )}
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-navy font-medium text-sm mb-1.5">Delivery method</label>
                <div className="grid grid-cols-3 gap-2">
                  {["email", "sms", "both"].map(m => (
                    <button key={m} type="button" onClick={() => setInvite({...invite, method: m})}
                      className={`py-2 rounded-lg border text-xs font-semibold capitalize transition-colors ${invite.method === m ? "bg-navy text-white border-navy" : "border-sand-dark text-body-brown hover:border-navy/30"}`}>{m}</button>
                  ))}
                </div>
              </div>
              {(invite.method === "email" || invite.method === "both") && (
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Email address {invite.method !== "sms" ? "*" : "(optional)"}</label>
                  <input type="email" value={invite.email} onChange={e => setInvite({...invite, email: e.target.value})} required={invite.method !== "sms"} className="w-full border border-sand-dark rounded-lg px-4 py-2.5 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
              )}
              {(invite.method === "sms" || invite.method === "both") && (
                <div>
                  <label className="block text-navy font-medium text-sm mb-1.5">Phone number *</label>
                  <input type="tel" value={invite.phone} onChange={e => setInvite({...invite, phone: e.target.value})} required className="w-full border border-sand-dark rounded-lg px-4 py-2.5 text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
              )}
              <button type="submit" disabled={inviteLoading} className="w-full bg-navy text-white font-bold py-3 rounded-xl text-sm hover:bg-navy-mid transition-colors disabled:opacity-60">
                {inviteLoading ? "Sending..." : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}