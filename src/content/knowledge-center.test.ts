import { describe, expect, it } from "vitest";

import {
  getKnowledgeArticle,
  getKnowledgeLearningPath,
  getKnowledgePathArticles,
  knowledgeArticles,
  knowledgeLearningPaths,
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

  it("publishes a complete, valid learning path for every calculator persona", () => {
    expect(Object.keys(knowledgeLearningPaths)).toEqual([
      "online_seller_business",
      "freelancer",
      "salaried_employee",
      "multiple_income",
      "unsure",
    ]);

    for (const path of Object.values(knowledgeLearningPaths)) {
      expect(path.articleSlugs.length).toBeGreaterThanOrEqual(4);
      expect(new Set(path.articleSlugs).size).toBe(path.articleSlugs.length);
      expect(
        path.articleSlugs.every((slug) => Boolean(getKnowledgeArticle(slug))),
      ).toBe(true);
    }
  });

  it("orders persona recommendations and excludes the current article", () => {
    expect(getKnowledgeLearningPath("salaried_employee").articleSlugs[0]).toBe(
      "tax-basics",
    );
    expect(
      getKnowledgePathArticles("salaried_employee", {
        excludeSlug: "tax-basics",
        limit: 3,
      }).map((article) => article.slug),
    ).toEqual(["withholding-tax", "allowances", "pnd91"]);
  });
});
