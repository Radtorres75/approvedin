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
        if (!me) {
          navigate("/signin", { replace: true });
          return;
        }
        setUser(me);
        if (me.role !== allowedRole) {
          if (me.role === "association_manager") navigate("/portal/association", { replace: true });
          else if (me.role === "vendor") navigate("/portal/vendor", { replace: true });
          else if (me.role === "resident") navigate("/portal/resident/dashboard", { replace: true });
          else navigate("/signin", { replace: true });
          return;
        }
        setLoading(false);
      } catch {
        navigate("/signin", { replace: true });
      }
    };
    check();
  }, [allowedRole, navigate]);

  return { loading, user };
}