import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sunbizDocs = await base44.asServiceRole.entities.ComplianceDocument.filter({ document_type: "sunbiz" });
    let updated = 0;
    for (const doc of sunbizDocs) {
      await base44.asServiceRole.entities.ComplianceDocument.update(doc.id, {
        reminder_90_sent: false,
        reminder_60_sent: false,
        reminder_30_sent: false,
        reminder_7_sent: false,
        reminder_expired_sent: false,
      });
      updated++;
    }
    return Response.json({ success: true, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});