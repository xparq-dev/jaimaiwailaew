"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminGovernanceClient } from "@/admin/governance-client";
import { useAuth } from "@/auth/auth-provider";

export type AdminEligibilityStatus =
  "loading" | "eligible" | "ineligible" | "unavailable";

export function useAdminEligibility(): AdminEligibilityStatus {
  const { getAccessToken, status: authStatus, user } = useAuth();
  const [result, setResult] = useState<{
    readonly status: Exclude<AdminEligibilityStatus, "loading">;
    readonly userId: string;
  } | null>(null);
  const api = useMemo(
    () => new AdminGovernanceClient(getAccessToken),
    [getAccessToken],
  );

  useEffect(() => {
    let active = true;

    if (authStatus !== "authenticated" || !user) {
      return () => {
        active = false;
      };
    }

    void api
      .getEligibility()
      .then(({ eligible }) => {
        if (active) {
          setResult({
            status: eligible ? "eligible" : "ineligible",
            userId: user.id,
          });
        }
      })
      .catch(() => {
        if (active) setResult({ status: "unavailable", userId: user.id });
      });

    return () => {
      active = false;
    };
  }, [api, authStatus, user]);

  if (authStatus === "loading") return "loading";
  if (authStatus !== "authenticated" || !user) return "ineligible";
  return result?.userId === user.id ? result.status : "loading";
}
