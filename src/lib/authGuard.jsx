import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export function useRoleGuard(allowedRole) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (!me) {
          base44.auth.redirectToLogin();
          return;
        }
        if (me.role !== allowedRole) {
          // Silent redirect to correct portal
          if (me.role === "association_manager") navigate("/portal/association", { replace: true });
          else if (me.role === "vendor") navigate("/portal/vendor", { replace: true });
          else if (me.role === "resident") navigate("/portal/resident/dashboard", { replace: true });
          else base44.auth.redirectToLogin();
          return;
        }
        setLoading(false);
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    check();
  }, [allowedRole, navigate]);

  return { loading, user };
}