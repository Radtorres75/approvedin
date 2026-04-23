import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export function useRoleGuard(allowedRole) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const me = await base44.auth.me();

        if (cancelled) return;

        if (!me) {
          navigate("/signin", { replace: true });
          return;
        }

        if (me.role !== allowedRole) {
          if (me.role === "association_manager") navigate("/portal/association", { replace: true });
          else if (me.role === "vendor") navigate("/portal/vendor", { replace: true });
          else if (me.role === "resident") navigate("/portal/resident/dashboard", { replace: true });
          else navigate("/signin", { replace: true });
          return;
        }

        setUser(me);
        setLoading(false);
      } catch {
        if (!cancelled) navigate("/signin", { replace: true });
      }
    };

    check();

    return () => { cancelled = true; };
  }, [allowedRole]);

  return { loading, user };
}