"use client";

import { ArrowRight, BookOpenCheck, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PersonaLearningPath } from "@/components/persona-learning-path";
import {
  formatKnowledgeReviewDate,
  knowledgeCategories,
  searchKnowledgeArticles,
  type KnowledgeCategory,
} from "@/content/knowledge-center";

const allCategories = ["ทั้งหมด", ...knowledgeCategories] as const;

export function KnowledgeCenterLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory | "ทั้งหมด">(
    "ทั้งหมด",
  );
  const results = useMemo(
    () => searchKnowledgeArticles(query, category),
    [category, query],
  );

  function resetFilters() {
    setQuery("");
    setCategory("ทั้งหมด");
  }

  return (
    <div className="space-y-6">
      <PersonaLearningPath />

      <section
        aria-label="ค้นหาและกรองบทความ"
        className="surface-card p-4 sm:p-6"
      >
        <label className="block" htmlFor="knowledge-search">
          <span className="font-semibold">ค้นหาหัวข้อที่ต้องการ</span>
          <span className="text-muted-foreground mt-1 block text-sm">
            ลองค้นหา เช่น เงินเดือน ภ.ง.ด.94 หรือภาษีหัก ณ ที่จ่าย
          </span>
          <span className="relative mt-3 block">
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
            />
            <input
              className="border-border bg-card focus:border-focus focus:ring-focus/20 min-h-12 w-full rounded-xl border py-3 pr-12 pl-12 text-base shadow-inner shadow-black/[0.02] outline-none focus:ring-3"
              id="knowledge-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาบทความ"
              type="search"
              value={query}
            />
            {query ? (
              <button
                aria-label="ล้างคำค้นหา"
                className="focus-visible:ring-focus absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-lg focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => setQuery("")}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </span>
        </label>

        <div aria-label="กรองตามหมวด" className="mt-4 flex flex-wrap gap-2">
          {allCategories.map((item) => (
            <button
              aria-pressed={category === item}
              className={`focus-visible:ring-focus min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                category === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
              key={item}
              onClick={() => setCategory(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <p aria-live="polite" className="text-muted-foreground text-sm">
        พบ {results.length} บทความ
      </p>

      {results.length ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {results.map((article) => (
            <li key={article.slug}>
              <Link
                className="surface-card focus-visible:ring-focus group hover:border-primary/25 flex h-full min-h-52 flex-col p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgb(8_48_41/10%)] focus-visible:ring-3 focus-visible:outline-none sm:p-6"
                href={`/learn/${article.slug}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="bg-success-soft text-success-strong rounded-full px-3 py-1 text-xs font-bold">
                    {article.category}
                  </span>
                  <BookOpenCheck
                    aria-hidden="true"
                    className="text-secondary size-5 shrink-0"
                  />
                </div>
                <h2 className="mt-4 text-lg font-bold sm:text-xl">
                  {article.title}
                </h2>
                <p className="text-muted-foreground mt-2 grow text-sm leading-6">
                  {article.summary}
                </p>
                <div className="border-border text-muted-foreground mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs">
                  <span>{article.readingMinutes} นาที</span>
                  <span>
                    ตรวจทาน {formatKnowledgeReviewDate(article.lastReviewedAt)}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="text-foreground size-4 transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <section className="surface-card p-8 text-center">
          <h2 className="text-lg font-bold">ยังไม่พบบทความที่ตรงกัน</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            ลองใช้คำที่สั้นลง เลือกหมวดอื่น หรือแสดงบทความทั้งหมด
          </p>
          <button
            className="border-border bg-background hover:bg-muted focus-visible:ring-focus mt-5 min-h-11 rounded-xl border px-4 py-2 font-semibold focus-visible:ring-2 focus-visible:outline-none"
            onClick={resetFilters}
            type="button"
          >
            ล้างตัวกรอง
          </button>
        </section>
      )}
    </div>
  );
}
