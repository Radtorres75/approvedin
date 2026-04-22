export const FLORIDA_COUNTIES = [
  "Alachua","Baker","Bay","Bradford","Brevard","Broward","Calhoun","Charlotte",
  "Citrus","Clay","Collier","Columbia","DeSoto","Dixie","Duval","Escambia",
  "Flagler","Franklin","Gadsden","Gilchrist","Glades","Gulf","Hamilton","Hardee",
  "Hendry","Hernando","Highlands","Hillsborough","Holmes","Indian River","Jackson",
  "Jefferson","Lafayette","Lake","Lee","Leon","Levy","Liberty","Madison","Manatee",
  "Marion","Martin","Miami-Dade","Monroe","Nassau","Okaloosa","Okeechobee","Orange",
  "Osceola","Palm Beach","Pasco","Pinellas","Polk","Putnam","Santa Rosa","Sarasota",
  "Seminole","St. Johns","St. Lucie","Sumter","Suwannee","Taylor","Union","Volusia",
  "Wakulla","Walton","Washington"
];

export const TRADE_CATEGORIES = [
  "Landscaping & Lawn Care","Pool & Spa Maintenance","Roofing","Plumbing","Electrical",
  "HVAC","Pest Control","Painting (Interior/Exterior)","Pressure Washing","Window Cleaning",
  "Janitorial & Cleaning","Elevator Maintenance","Fire Safety & Sprinklers","Security Systems",
  "Gate & Access Control","Concrete & Pavement","Waterproofing","Handyman Services",
  "Tree Service & Arborist","Dock & Marine Services","Moving Services",
  "Restoration & Remediation","Waste Management","General Contracting",
  "Engineering & Inspection","Legal Services","Accounting & Financial Services",
  "Property Management Companies","Technology & IT","Other"
];

export const ASSOCIATION_TYPES = [
  "Condominium","Homeowners Association","Cooperative","Community Development District",
  "Condo-Hotel","Dockominium","Commercial Association","Mixed-Use Association",
  "Mobile Home and Manufactured Housing Community"
];

export const COMPLIANCE_STATUS_LABELS = {
  active: "Active",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
  missing: "Missing",
  not_carried: "Not Carried",
  hold_harmless: "Hold Harmless",
  noncompliant: "Noncompliant",
  pending_review: "Pending Review",
  suspended: "Suspended",
};

export const COMPLIANCE_STATUS_CLASSES = {
  active: "badge-active",
  expiring_soon: "badge-expiring-soon",
  expired: "badge-expired",
  missing: "badge-missing",
  not_carried: "badge-not-carried",
  hold_harmless: "badge-hold-harmless",
  noncompliant: "badge-noncompliant",
  pending_review: "badge-pending-review",
  suspended: "badge-suspended",
};

export function computeDocStatus(expirationDate) {
  if (!expirationDate) return "missing";
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 60) return "expiring_soon";
  return "active";
}

export function getSunbizExpirationDate() {
  const year = new Date().getFullYear();
  return `${year}-05-01`;
}

export function computeProfileCompletion(vendor, documents) {
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

  const coiOk = coi && coi.gl_expiration_date;
  criteria.push(!!coiOk);

  const tradeLicenseOk = tradeLicense && tradeLicense.expiration_date;
  criteria.push(!!tradeLicenseOk);

  const wcOk = workerComp && (
    workerComp.workers_comp_option === "hold_harmless" ||
    workerComp.workers_comp_option === "do_not_carry" ||
    (workerComp.workers_comp_option === "policy_uploaded" && workerComp.expiration_date)
  );
  criteria.push(!!wcOk);

  const sunbizOk = sunbiz && sunbiz.file_url;
  criteria.push(!!sunbizOk);

  const met = criteria.filter(Boolean).length;
  return Math.round((met / 10) * 100);
}