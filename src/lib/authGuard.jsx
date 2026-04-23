import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export function useRoleGuard(allowedRole) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        const me = await base44.auth.me();
        if (!me) {
          window.location.href = "/signin";
          return;
        }
        if (me.role !== allowedRole) {
          if (me.role === "association_manager") window.location.href = "/portal/association";
          else if (me.role === "vendor") window.location.href = "/portal/vendor";
          else if (me.role === "resident") window.location.href = "/portal/resident/dashboard";
          else window.location.href = "/signin";
          return;
        }
        setUser(me);
        setLoading(false);
      } catch {
        window.location.href = "/signin";
      }
    };
    check();
  }, [allowedRole]);

  return { loading, user };
}