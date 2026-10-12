import { describe, expect, it, vi } from "vitest";

import {
  aggregateUserAnalytics,
  loadUserAnalytics,
} from "../../../workers/user-analytics";

describe("aggregate user analytics", () => {
  it("returns anonymous totals, providers, and a bounded daily trend", () => {
    const analytics = aggregateUserAnalytics(
      [
        {
          createdAt: "2026-10-11T08:00:00.000Z",
          lastSignInAt: "2026-10-12T01:00:00.000Z",
          provider: "google",
        },
        {
          createdAt: "2026-08-01T08:00:00.000Z",
          lastSignInAt: "2026-09-01T01:00:00.000Z",
          provider: "github",
        },
      ],
      "2026-10-12T04:00:00.000Z",
      30,
    );

    expect(analytics).toMatchObject({
      totalUsers: 2,
      newUsers: 1,
      recentUsers: 1,
      providers: [
        { provider: "google", users: 1 },
        { provider: "github", users: 1 },
      ],
    });
    expect(analytics.trend).toHaveLength(30);
    expect(
      analytics.trend.reduce((sum, point) => sum + point.registrations, 0),
    ).toBe(1);
    expect(
      analytics.trend.reduce((sum, point) => sum + point.recentSignIns, 0),
    ).toBe(1);
    expect(JSON.stringify(analytics)).not.toContain("email");
  });

  it("keeps the service role key server-side while loading users", async () => {
    const fetcher = vi.fn(
      async (_url: URL | RequestInfo, init?: RequestInit) => {
        expect(init?.headers).toEqual({
          apikey: "server-secret",
          Authorization: "Bearer server-secret",
        });
        return new Response(
          JSON.stringify({
            users: [
              {
                id: "private-user-id",
                email: "private@example.com",
                created_at: "2026-10-12T01:00:00.000Z",
                last_sign_in_at: "2026-10-12T02:00:00.000Z",
                app_metadata: { provider: "google" },
              },
            ],
          }),
          { status: 200 },
        );
      },
    );

    const analytics = await loadUserAnalytics(
      {
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "server-secret",
      },
      "2026-10-12T04:00:00.000Z",
      fetcher as typeof fetch,
    );

    expect(analytics.totalUsers).toBe(1);
    expect(JSON.stringify(analytics)).not.toContain("private-user-id");
    expect(JSON.stringify(analytics)).not.toContain("private@example.com");
  });
});
