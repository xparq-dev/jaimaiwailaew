import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { KnowledgeArticle } from "@/components/knowledge-article";
import {
  getKnowledgeArticle,
  knowledgeArticles,
} from "@/content/knowledge-center";

export function generateStaticParams() {
  return knowledgeArticles.map((article) => ({ article: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ article: string }>;
}): Promise<Metadata> {
  const { article: slug } = await params;
  const article = getKnowledgeArticle(slug);

  if (!article) return {};

  return {
    title: article.title,
    description: article.summary,
  };
}

export default async function LearnArticlePage({
  params,
}: {
  params: Promise<{ article: string }>;
}) {
  const { article: slug } = await params;
  const article = getKnowledgeArticle(slug);

  if (!article) notFound();

  return <KnowledgeArticle article={article} />;
}
