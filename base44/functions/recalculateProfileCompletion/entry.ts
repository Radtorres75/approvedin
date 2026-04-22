import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function computeProfileCompletion(vendor, documents) {
  if (!vendor) return 0;
  const criteria = [];
  criteria.push(!!vendor.business_name);
  criteria.push(!!vendor.business_phone);
  criteria.push(!!vendor.business_email);
  criteria.push(!!(vendor.trade_categories && vendor.trade_categories.length > 0));
  criteria.push(!!(vendor.florida_counties_served && vendor.florida_counties_served.length > 0));
  criteria.push(!!vendor.business_description);

  const activeDocs = (documents || []).filter(d => !d.is_archived);
  const coi = activeDocs.find(d => d.document_type === "coi");
  const tradeLicense = activeDocs.find(d => d.document_type === "trade_license");
  const workerComp = activeDocs.find(d => d.document_type === "workers_comp");
  const sunbiz = activeDocs.find(d => d.document_type === "sunbiz");

  criteria.push(!!(coi && coi.gl_expiration_date));
  criteria.push(!!(tradeLicense && tradeLicense.expiration_date));
  criteria.push(!!(workerComp && (
    workerComp.workers_comp_option === "hold_harmless" ||
    workerComp.workers_comp_option === "do_not_carry" ||
    (workerComp.workers_comp_option === "policy_uploaded" && workerComp.expiration_date)
  )));
  criteria.push(!!(sunbiz && sunbiz.file_url));

  return Math.round((criteria.filter(Boolean).length / 10) * 100);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { vendor_id } = body;

    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: vendor_id });
    const vendor = vendors[0];
    if (!vendor) return Response.json({ error: "Vendor not found" }, { status: 404 });

    const documents = await base44.asServiceRole.entities.ComplianceDocument.filter({ vendor_id });
    const pct = computeProfileCompletion(vendor, documents);

    await base44.asServiceRole.entities.Vendor.update(vendor_id, {
      profile_completion_percentage: pct,
    });

    return Response.json({ success: true, profile_completion_percentage: pct });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});