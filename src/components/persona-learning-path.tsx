"use client";

import { ArrowRight, BookOpen, Route } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { getPersonaLabel, PERSONA_OPTIONS } from "@/calculator/categories";
import { useCalculatorStore } from "@/calculator/store";
import type { CalculatorPersona } from "@/calculator/types";
import { useCalculatorHydrated } from "@/components/calculator/calculator-hydration";
import {
  getKnowledgeLearningPath,
  getKnowledgePathArticles,
} from "@/content/knowledge-center";

export function PersonaLearningPath({
  currentArticleSlug,
}: {
  readonly currentArticleSlug?: string;
}) {
  const hydrated = useCalculatorHydrated();
  const workspacePersona = useCalculatorStore(
    (state) => state.workspace?.persona,
  );
  const [selectedPersona, setSelectedPersona] =
    useState<CalculatorPersona | null>(null);
  const persona = selectedPersona ?? workspacePersona ?? "unsure";
  const path = getKnowledgeLearningPath(persona);
  const articles = getKnowledgePathArticles(persona, {
    ...(currentArticleSlug ? { excludeSlug: currentArticleSlug } : {}),
    limit: 3,
  });
  const isArticleContext = Boolean(currentArticleSlug);

  if (!hydrated) {
    return (
      <section
        aria-label="กำลังเตรียมเส้นทางแนะนำ"
        className="border-border bg-card min-h-64 animate-pulse rounded-2xl border p-5 shadow-sm sm:p-6"
      >
        <div className="bg-muted h-5 w-40 rounded" />
        <div className="bg-muted mt-4 h-8 w-3/4 rounded" />
        <div className="bg-muted mt-3 h-5 w-full rounded" />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div className="bg-muted h-24 rounded-xl" key={item} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={
        isArticleContext
          ? "personalized-read-next"
          : "personalized-learning-path"
      }
      className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm"
    >
      <div className="border-border bg-muted/40 border-b p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-success-strong flex items-center gap-2 text-sm font-bold">
              <Route aria-hidden="true" className="size-4" />
              {isArticleContext
                ? "อ่านต่อให้ตรงกับคุณ"
                : "เส้นทางแนะนำสำหรับคุณ"}
            </p>
            <h2
              className="mt-2 text-xl font-bold sm:text-2xl"
              id={
                isArticleContext
                  ? "personalized-read-next"
                  : "personalized-learning-path"
              }
            >
              {path.title}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {path.description}
            </p>
          </div>

          <div className="w-full lg:max-w-xs">
            <label
              className="text-muted-foreground block text-xs font-semibold"
              htmlFor={`knowledge-persona-${currentArticleSlug ?? "library"}`}
            >
              เลือกสถานการณ์สำหรับการอ่าน
            </label>
            <select
              className="border-border bg-background focus:border-focus focus:ring-focus/20 mt-2 min-h-11 w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none focus:ring-3"
              id={`knowledge-persona-${currentArticleSlug ?? "library"}`}
              onChange={(event) =>
                setSelectedPersona(event.target.value as CalculatorPersona)
              }
              value={persona}
            >
              {PERSONA_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground mt-2 text-xs leading-5">
              {selectedPersona
                ? "เปลี่ยนเฉพาะคำแนะนำหน้านี้ ไม่แก้ประเภทผู้ใช้ใน Workspace"
                : workspacePersona
                  ? `อิงจาก Workspace ปัจจุบัน: ${getPersonaLabel(workspacePersona)}`
                  : "ยังไม่มี Workspace จึงเริ่มด้วยเส้นทางสำหรับผู้ที่ยังไม่แน่ใจ"}
            </p>
            {selectedPersona && workspacePersona ? (
              <button
                className="text-primary focus-visible:ring-focus mt-2 min-h-10 rounded-lg px-2 text-xs font-bold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => setSelectedPersona(null)}
                type="button"
              >
                ใช้ประเภทจาก Workspace
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <ol className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
        {articles.map((article, index) => (
          <li key={article.slug}>
            <Link
              className="group border-border bg-background hover:border-focus focus-visible:ring-focus flex h-full min-h-32 flex-col rounded-xl border p-4 focus-visible:ring-3 focus-visible:outline-none"
              href={`/learn/${article.slug}`}
            >
              <span className="text-success-strong flex items-center gap-2 text-xs font-bold">
                <span className="bg-success-soft grid size-6 place-items-center rounded-full">
                  {index + 1}
                </span>
                {article.readingMinutes} นาที
              </span>
              <span className="mt-3 grow text-sm leading-6 font-bold">
                {article.title}
              </span>
              <span className="text-muted-foreground mt-3 flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <BookOpen aria-hidden="true" className="size-3.5" />
                  อ่านบทความ
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="text-muted-foreground border-border border-t px-5 py-3 text-xs leading-5 sm:px-6">
        เส้นทางนี้ช่วยจัดลำดับบทความเท่านั้น
        ไม่ได้ตัดสินหน้าที่หรือสิทธิทางภาษีแทนคุณ
      </p>
    </section>
  );
}
