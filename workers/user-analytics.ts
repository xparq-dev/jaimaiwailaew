import { z } from "zod";

const authUserSchema = z.looseObject({
  app_metadata: z
    .looseObject({ provider: z.string().optional() })
    .optional()
    .default({}),
  created_at: z.string(),
  last_sign_in_at: z.string().nullable().optional(),
});

const authUsersResponseSchema = z.looseObject({
  users: z.array(authUserSchema),
});

export interface AuthUserSummary {
  readonly createdAt: string;
  readonly lastSignInAt: string | null;
  readonly provider: string;
}

export interface UserAnalytics {
  readonly generatedAt: string;
  readonly windowDays: number;
  readonly totalUsers: number;
  readonly newUsers: number;
  readonly recentUsers: number;
  readonly providers: readonly {
    readonly provider: string;
    readonly users: number;
  }[];
  readonly trend: readonly {
    readonly date: string;
    readonly registrations: number;
    readonly recentSignIns: number;
  }[];
}

interface SupabaseAdminEnvironment {
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly SUPABASE_URL?: string;
}

const bangkokDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Bangkok",
  year: "numeric",
});

function bangkokDate(value: Date) {
  const parts = bangkokDateFormatter.formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function normalizedProvider(provider: string) {
  const value = provider.trim().toLowerCase();
  if (value === "google" || value === "github") return value;
  return "other";
}

export function aggregateUserAnalytics(
  users: readonly AuthUserSummary[],
  nowValue: string,
  windowDays = 30,
): UserAnalytics {
  const now = new Date(nowValue);

  const daily = new Map<
    string,
    { registrations: number; recentSignIns: number }
  >();
  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - offset);
    daily.set(bangkokDate(date), { registrations: 0, recentSignIns: 0 });
  }

  const providerCounts = new Map<string, number>();
  let newUsers = 0;
  let recentUsers = 0;

  for (const user of users) {
    const provider = normalizedProvider(user.provider);
    providerCounts.set(provider, (providerCounts.get(provider) ?? 0) + 1);

    const createdAt = new Date(user.createdAt);
    if (!Number.isNaN(createdAt.getTime())) {
      const point = daily.get(bangkokDate(createdAt));
      if (point) {
        newUsers += 1;
        point.registrations += 1;
      }
    }

    if (!user.lastSignInAt) continue;
    const lastSignInAt = new Date(user.lastSignInAt);
    if (!Number.isNaN(lastSignInAt.getTime())) {
      const point = daily.get(bangkokDate(lastSignInAt));
      if (point) {
        recentUsers += 1;
        point.recentSignIns += 1;
      }
    }
  }

  return {
    generatedAt: now.toISOString(),
    windowDays,
    totalUsers: users.length,
    newUsers,
    recentUsers,
    providers: [...providerCounts.entries()]
      .map(([provider, count]) => ({ provider, users: count }))
      .sort((left, right) => right.users - left.users),
    trend: [...daily.entries()].map(([date, values]) => ({ date, ...values })),
  };
}

export async function loadUserAnalytics(
  environment: SupabaseAdminEnvironment,
  nowValue: string,
  fetcher: typeof fetch = fetch,
) {
  if (!environment.SUPABASE_URL || !environment.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("supabase_admin_unconfigured");
  }

  const users: AuthUserSummary[] = [];
  const perPage = 1_000;

  for (let page = 1; page <= 100; page += 1) {
    const url = new URL("/auth/v1/admin/users", environment.SUPABASE_URL);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    const response = await fetcher(url, {
      headers: {
        apikey: environment.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!response.ok) throw new Error("supabase_admin_request_failed");

    const parsed = authUsersResponseSchema.parse(await response.json());
    users.push(
      ...parsed.users.map((user) => ({
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        provider: user.app_metadata.provider ?? "other",
      })),
    );
    if (parsed.users.length < perPage) break;
  }

  return aggregateUserAnalytics(users, nowValue);
}
