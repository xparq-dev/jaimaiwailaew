"use client";

import {
  Activity,
  CalendarPlus,
  LoaderCircle,
  RefreshCw,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

import { adminErrorCopy } from "@/admin/error-copy";
import type {
  AdminGovernanceClient,
  UserAnalytics,
} from "@/admin/governance-client";
import { Button } from "@/components/ui/button";

const PROVIDER_LABELS: Readonly<Record<string, string>> = {
  github: "GitHub",
  google: "Google",
  other: "ช่องทางอื่น",
};

export function UserAnalyticsPanel({
  api,
}: {
  readonly api: AdminGovernanceClient;
}) {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAnalytics((await api.getUserAnalytics()).analytics);
    } catch (loadError) {
      setError(adminErrorCopy(loadError));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading && !analytics) return <AnalyticsSkeleton />;

  if (error && !analytics) {
    return (
      <section className="surface-card p-5 sm:p-6" role="alert">
        <Activity aria-hidden="true" className="text-danger size-6" />
        <h2 className="mt-4 text-xl font-bold">โหลดภาพรวมผู้ใช้งานไม่ได้</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          {error}
        </p>
        <Button
          className="mt-4"
          onClick={() => void load()}
          variant="secondary"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          ลองอีกครั้ง
        </Button>
      </section>
    );
  }

  if (!analytics) return null;

  return (
    <section aria-labelledby="user-overview-title" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-success-strong text-sm font-bold">
            ภาพรวมผู้ใช้งาน
          </p>
          <h2 className="mt-1 text-2xl font-bold" id="user-overview-title">
            แนวโน้มการใช้งาน
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            ข้อมูลรวมจากระบบบัญชี ไม่แสดงชื่อ อีเมล หรือข้อมูลการเงิน
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs">
            อัปเดต {formatTimestamp(analytics.generatedAt)}
          </p>
          <Button
            aria-label="โหลดภาพรวมผู้ใช้งานล่าสุด"
            disabled={loading}
            onClick={() => void load()}
            size="icon"
            variant="secondary"
          >
            {loading ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : (
              <RefreshCw aria-hidden="true" className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AnalyticsMetric
          description="บัญชีที่สมัครทั้งหมด"
          icon={UsersRound}
          label="ผู้ใช้ทั้งหมด"
          value={analytics.totalUsers}
        />
        <AnalyticsMetric
          description={`สมัครใน ${analytics.windowDays} วันที่ผ่านมา`}
          icon={CalendarPlus}
          label="ผู้ใช้ใหม่"
          value={analytics.newUsers}
        />
        <AnalyticsMetric
          description={`เข้าสู่ระบบใน ${analytics.windowDays} วันที่ผ่านมา`}
          icon={UserRoundCheck}
          label="ผู้ใช้ล่าสุด"
          value={analytics.recentUsers}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.7fr)]">
        <UserTrendChart analytics={analytics} />
        <ProviderBreakdown analytics={analytics} />
      </div>
    </section>
  );
}

function AnalyticsMetric({
  description,
  icon: Icon,
  label,
  value,
}: {
  readonly description: string;
  readonly icon: typeof UsersRound;
  readonly label: string;
  readonly value: number;
}) {
  return (
    <article className="surface-card flex min-h-32 items-center gap-4 p-5">
      <span className="bg-success-soft text-success-strong grid size-11 shrink-0 place-items-center rounded-xl">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <p className="text-muted-foreground text-xs font-bold">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {value.toLocaleString("th-TH")}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      </div>
    </article>
  );
}

function UserTrendChart({ analytics }: { readonly analytics: UserAnalytics }) {
  const titleId = useId();
  const width = 760;
  const height = 250;
  const paddingX = 28;
  const paddingTop = 20;
  const paddingBottom = 35;
  const plotHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(
    1,
    ...analytics.trend.flatMap((point) => [
      point.registrations,
      point.recentSignIns,
    ]),
  );
  const xFor = (index: number) =>
    paddingX +
    (index / Math.max(analytics.trend.length - 1, 1)) * (width - paddingX * 2);
  const yFor = (value: number) =>
    paddingTop + plotHeight - (value / maxValue) * plotHeight;
  const line = (key: "registrations" | "recentSignIns") =>
    analytics.trend
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${xFor(index).toFixed(1)},${yFor(point[key]).toFixed(1)}`,
      )
      .join(" ");
  const labelIndexes = [
    0,
    Math.floor(analytics.trend.length / 2),
    analytics.trend.length - 1,
  ];

  return (
    <figure className="surface-card overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold" id={titleId}>
            ผู้ใช้ในช่วง {analytics.windowDays} วัน
          </h3>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            นับวันที่สมัครและวันที่เข้าสู่ระบบล่าสุดของแต่ละบัญชี
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="bg-success-strong size-2.5 rounded-full" />
            ผู้ใช้ใหม่
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-warning-strong size-2.5 rounded-full" />
            เข้าสู่ระบบล่าสุด
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden">
        <svg
          aria-labelledby={titleId}
          className="h-auto min-h-48 w-full"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          {[0, 0.5, 1].map((position) => {
            const y = paddingTop + plotHeight * position;
            return (
              <line
                className="text-border"
                key={position}
                stroke="currentColor"
                strokeWidth="1"
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
              />
            );
          })}
          <path
            className="text-warning-strong"
            d={line("recentSignIns")}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path
            className="text-success-strong"
            d={line("registrations")}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {labelIndexes.map((index) => {
            const point = analytics.trend[index];
            if (!point) return null;
            return (
              <text
                className="fill-muted-foreground text-[11px]"
                key={point.date}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === analytics.trend.length - 1
                      ? "end"
                      : "middle"
                }
                x={xFor(index)}
                y={height - 8}
              >
                {formatShortDate(point.date)}
              </text>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}

function ProviderBreakdown({
  analytics,
}: {
  readonly analytics: UserAnalytics;
}) {
  return (
    <section
      className="surface-card p-5 sm:p-6"
      aria-labelledby="provider-title"
    >
      <h3 className="font-bold" id="provider-title">
        ช่องทางเข้าสู่ระบบ
      </h3>
      <p className="text-muted-foreground mt-1 text-xs leading-5">
        แยกตามช่องทางหลักของแต่ละบัญชี
      </p>
      <div className="mt-6 space-y-5">
        {analytics.providers.map((provider) => {
          const percentage = analytics.totalUsers
            ? (provider.users / analytics.totalUsers) * 100
            : 0;
          return (
            <div key={provider.provider}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold">
                  {PROVIDER_LABELS[provider.provider] ?? "ช่องทางอื่น"}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {provider.users.toLocaleString("th-TH")} ·{" "}
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                <div
                  className="bg-success-strong h-full rounded-full"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AnalyticsSkeleton() {
  return (
    <section
      aria-label="กำลังโหลดภาพรวมผู้ใช้งาน"
      className="space-y-4"
      role="status"
    >
      <div className="space-y-2">
        <div className="bg-muted h-4 w-28 animate-pulse rounded" />
        <div className="bg-muted h-8 w-56 animate-pulse rounded" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="surface-card h-32 animate-pulse" key={item} />
        ))}
      </div>
      <div className="surface-card h-72 animate-pulse" />
    </section>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(`${value}T00:00:00+07:00`));
}
