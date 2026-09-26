import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

import {
  formatKnowledgeReviewDate,
  getKnowledgeArticle,
  type KnowledgeArticle as KnowledgeArticleData,
} from "@/content/knowledge-center";

export function KnowledgeArticle({
  article,
}: {
  readonly article: KnowledgeArticleData;
}) {
  const relatedArticles = article.relatedSlugs
    .map(getKnowledgeArticle)
    .filter((item): item is KnowledgeArticleData => Boolean(item));

  return (
    <article className="mx-auto max-w-4xl space-y-7">
      <Link
        className="text-muted-foreground hover:text-foreground focus-visible:ring-focus inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
        href="/learn"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        กลับไปศูนย์ความรู้
      </Link>

      <header className="space-y-4">
        <span className="bg-success-soft text-success-strong inline-flex rounded-full px-3 py-1 text-xs font-bold">
          {article.category}
        </span>
        <h1 className="max-w-3xl text-3xl leading-tight font-bold sm:text-4xl">
          {article.title}
        </h1>
        <p className="text-muted-foreground max-w-3xl text-base leading-7 sm:text-lg">
          {article.summary}
        </p>
        <dl className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <BookOpenCheck aria-hidden="true" className="size-4" />
            <dt className="sr-only">เวลาอ่าน</dt>
            <dd>ประมาณ {article.readingMinutes} นาที</dd>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-4" />
            <dt className="sr-only">วันที่ตรวจทาน</dt>
            <dd>
              ตรวจทาน {formatKnowledgeReviewDate(article.lastReviewedAt)} · รุ่น{" "}
              {article.version}
            </dd>
          </div>
        </dl>
      </header>

      <aside className="border-warning/30 bg-warning-soft text-warning-strong rounded-2xl border p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <h2 className="font-bold">ใช้เพื่อทำความเข้าใจและเตรียมข้อมูล</h2>
            <p className="mt-1 text-sm leading-6">
              บทความนี้ไม่ใช่คำปรึกษาภาษีและไม่แทนแบบหรือประกาศทางการ
              โปรดตรวจข้อมูลล่าสุดกับกรมสรรพากรหรือผู้เชี่ยวชาญก่อนยื่นจริง
            </p>
          </div>
        </div>
      </aside>

      <div className="space-y-5">
        {article.sections.map((section) => (
          <section
            className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-7"
            key={section.heading}
          >
            <h2 className="text-xl font-bold">{section.heading}</h2>
            <div className="text-muted-foreground mt-4 space-y-3 leading-7">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {section.checklist ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {section.checklist.map((item) => (
                  <li
                    className="border-border bg-background flex gap-3 rounded-xl border px-4 py-3 text-sm leading-6"
                    key={item}
                  >
                    <span
                      aria-hidden="true"
                      className="bg-success-soft text-success-strong mt-1 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold"
                    >
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <section className="border-border bg-muted/50 rounded-2xl border p-5 sm:p-7">
        <h2 className="text-xl font-bold">แหล่งข้อมูลทางการ</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          ลิงก์ต่อไปนี้เปิดเว็บไซต์ภายนอกเมื่อผู้ใช้เลือกเอง
          เนื้อหาในเว็บนี้ไม่ถูกอัปเดตแบบเรียลไทม์
        </p>
        <ul className="mt-4 space-y-3">
          {article.sources.map((source) => (
            <li key={source.url}>
              <a
                className="border-border bg-card hover:border-focus focus-visible:ring-focus flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
                href={source.url}
                rel="noreferrer"
                target="_blank"
              >
                <span>
                  {source.title}
                  <span className="text-muted-foreground mt-0.5 block text-xs font-normal">
                    {source.authority}
                  </span>
                </span>
                <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold">อ่านต่อ</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {relatedArticles.map((related) => (
            <li key={related.slug}>
              <Link
                className="border-border bg-card hover:border-focus focus-visible:ring-focus flex h-full min-h-24 items-center rounded-xl border p-4 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
                href={`/learn/${related.slug}`}
              >
                {related.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
