import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function computeStatus(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const exp = new Date(dateStr);
  const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "expired";
  if (diff <= 60) return "expiring_soon";
  return "active";
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const exp = new Date(dateStr);
  return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const docs = await base44.asServiceRole.entities.ComplianceDocument.filter({ is_archived: false });
    let processed = 0;

    for (const doc of docs) {
      // Collect all date fields to check
      const dateFields = [];
      if (doc.document_type === "coi") {
        if (doc.gl_expiration_date) dateFields.push({ field: "gl_expiration_date", label: "General Liability (COI)", date: doc.gl_expiration_date, alwaysCheck: true });
        if (doc.auto_expiration_date && !doc.auto_do_not_carry && !doc.auto_hold_harmless) dateFields.push({ field: "auto_expiration_date", label: "Commercial Auto (COI)", date: doc.auto_expiration_date });
        if (doc.umbrella_expiration_date && !doc.umbrella_do_not_carry && !doc.umbrella_hold_harmless) dateFields.push({ field: "umbrella_expiration_date", label: "Umbrella/Excess Liability (COI)", date: doc.umbrella_expiration_date });
        if (doc.professional_expiration_date && !doc.professional_do_not_carry && !doc.professional_hold_harmless) dateFields.push({ field: "professional_expiration_date", label: "Professional Liability (COI)", date: doc.professional_expiration_date });
      } else if (doc.document_type === "trade_license") {
        if (doc.expiration_date) dateFields.push({ field: "expiration_date", label: "Trade License", date: doc.expiration_date });
      } else if (doc.document_type === "workers_comp") {
        if (doc.workers_comp_option === "policy_uploaded" && doc.expiration_date) dateFields.push({ field: "expiration_date", label: "Workers Compensation", date: doc.expiration_date });
      } else if (doc.document_type === "sunbiz") {
        if (doc.expiration_date) dateFields.push({ field: "expiration_date", label: "Florida Sunbiz", date: doc.expiration_date });
      }

      for (const df of dateFields) {
        const days = daysUntil(df.date);
        if (days === null) continue;
        const updates = {};

        const thresholds = [
          { days: 90, flag: "reminder_90_sent" },
          { days: 60, flag: "reminder_60_sent" },
          { days: 30, flag: "reminder_30_sent" },
          { days: 7, flag: "reminder_7_sent" },
        ];

        for (const t of thresholds) {
          if (days <= t.days && !doc[t.flag]) {
            updates[t.flag] = true;
            // Get vendor info
            const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: doc.vendor_id });
            const vendor = vendors[0];
            if (!vendor) continue;

            // Notify vendor
            await base44.asServiceRole.entities.Notification.create({
              user_id: vendor.user_id,
              notification_type: "document_expiring",
              title: `${df.label} expires in ${days} days`,
              message: `Your ${df.label} expires on ${df.date}. Please renew it to maintain your compliance status and stay approved in your associations.`,
              related_entity_type: "ComplianceDocument",
              related_entity_id: doc.id,
              action_url: "/portal/vendor/documents",
              is_read: false,
            });

            // Notify association managers
            const assocVendors = await base44.asServiceRole.entities.AssociationVendor.filter({ vendor_id: doc.vendor_id, status: "approved" });
            for (const av of assocVendors) {
              const assocs = await base44.asServiceRole.entities.Association.filter({ id: av.association_id });
              const assoc = assocs[0];
              if (!assoc) continue;
              await base44.asServiceRole.entities.Notification.create({
                user_id: assoc.user_id,
                notification_type: "document_expiring",
                title: `Action Required: ${vendor.business_name}'s ${df.label} expires in ${days} days`,
                message: `${vendor.business_name}'s ${df.label} expires on ${df.date} (${days} days remaining). Please follow up with the vendor to ensure document renewal.`,
                related_entity_type: "ComplianceDocument",
                related_entity_id: doc.id,
                action_url: "/portal/association/documents",
                is_read: false,
              });
            }
          }
        }

        // Expiration
        if (days <= 0 && !doc.reminder_expired_sent) {
          updates.reminder_expired_sent = true;
          updates.status = "expired";

          const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: doc.vendor_id });
          const vendor = vendors[0];
          if (vendor) {
            await base44.asServiceRole.entities.Notification.create({
              user_id: vendor.user_id,
              notification_type: "document_expired",
              title: `${df.label} has expired`,
              message: `Your ${df.label} expired on ${df.date}. Your account is now suspended from associated directories. Upload a renewed document immediately to restore your compliance status.`,
              related_entity_type: "ComplianceDocument",
              related_entity_id: doc.id,
              action_url: "/portal/vendor/documents",
              is_read: false,
            });

            // Suspend vendor in all associations
            const assocVendors = await base44.asServiceRole.entities.AssociationVendor.filter({ vendor_id: doc.vendor_id });
            for (const av of assocVendors) {
              await base44.asServiceRole.entities.AssociationVendor.update(av.id, {
                status: "suspended",
                suspension_reason: "noncompliance_auto",
                is_visible_in_resident_directory: false,
                suspended_date: new Date().toISOString().split("T")[0],
              });
              const assocs = await base44.asServiceRole.entities.Association.filter({ id: av.association_id });
              const assoc = assocs[0];
              if (assoc) {
                await base44.asServiceRole.entities.Notification.create({
                  user_id: assoc.user_id,
                  notification_type: "document_expired",
                  title: `${vendor.business_name}'s ${df.label} has expired`,
                  message: `${vendor.business_name}'s ${df.label} expired on ${df.date}. The vendor has been automatically suspended from your directory.`,
                  related_entity_type: "ComplianceDocument",
                  related_entity_id: doc.id,
                  action_url: "/portal/association/documents",
                  is_read: false,
                });
              }
            }
            await base44.asServiceRole.entities.Vendor.update(vendor.id, { overall_compliance_status: "noncompliant" });
          }
        }

        if (Object.keys(updates).length > 0) {
          await base44.asServiceRole.entities.ComplianceDocument.update(doc.id, updates);
          processed++;
        }
      }
    }

    return Response.json({ success: true, processed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});