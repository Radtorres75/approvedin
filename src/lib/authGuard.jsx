import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export function useRoleGuard(allowedRole) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        // Wait for session to fully initialize after hard navigation
        await new Promise(resolve => setTimeout(resolve, 800));

        let me = null;
        let attempts = 0;

        // Retry up to 5 times with 400ms gaps
        while (!me && attempts < 5) {
          try {
            me = await base44.auth.me();
          } catch (e) {
            // session not ready yet
          }
          if (!me) await new Promise(resolve => setTimeout(resolve, 400));
          attempts++;
        }

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