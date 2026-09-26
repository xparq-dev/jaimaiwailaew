import { describe, expect, it } from "vitest";

import {
  getKnowledgeArticle,
  knowledgeArticles,
  searchKnowledgeArticles,
} from "./knowledge-center";

describe("knowledge center content", () => {
  it("publishes every article with review metadata, official sources, and related content", () => {
    expect(knowledgeArticles).toHaveLength(9);

    for (const article of knowledgeArticles) {
      expect(article.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(article.lastReviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.sections.length).toBeGreaterThan(0);
      expect(article.sources.length).toBeGreaterThan(0);
      expect(article.relatedSlugs.length).toBeGreaterThan(0);
      expect(
        article.sources.every((source) =>
          source.url.startsWith("https://www.rd.go.th/"),
        ),
      ).toBe(true);
      expect(
        article.relatedSlugs.every((slug) => getKnowledgeArticle(slug)),
      ).toBe(true);
    }
  });

  it("searches Thai titles, keywords, and section content", () => {
    expect(
      searchKnowledgeArticles("เงินเดือน").map((item) => item.slug),
    ).toEqual(expect.arrayContaining(["pnd91", "income-types"]));
    expect(searchKnowledgeArticles("50 ทวิ").map((item) => item.slug)).toEqual([
      "withholding-tax",
    ]);
  });

  it("filters categories and returns an honest empty state result", () => {
    expect(
      searchKnowledgeArticles("", "แบบภาษี").map((item) => item.slug),
    ).toEqual(["pnd94", "pnd91", "tax-calendar"]);
    expect(searchKnowledgeArticles("คำที่ไม่มีในบทความ")).toEqual([]);
  });
});
