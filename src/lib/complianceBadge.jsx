import React from "react";
import { COMPLIANCE_STATUS_LABELS, COMPLIANCE_STATUS_CLASSES } from "./constants";

export default function ComplianceBadge({ status, className = "" }) {
  const label = COMPLIANCE_STATUS_LABELS[status] || status;
  const cls = COMPLIANCE_STATUS_CLASSES[status] || "badge-missing";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls} ${className}`}>
      {label}
    </span>
  );
}