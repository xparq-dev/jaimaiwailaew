import { notFound } from "next/navigation";

import { PlaceholderPage } from "@/components/placeholder-page";
import { learnPlaceholders } from "@/content/route-placeholders";

export function generateStaticParams() {
  return Object.keys(learnPlaceholders).map((article) => ({ article }));
}

export default async function LearnArticlePage({
  params,
}: {
  params: Promise<{ article: string }>;
}) {
  const { article } = await params;
  const content = learnPlaceholders[article as keyof typeof learnPlaceholders];

  if (!content) notFound();

  return <PlaceholderPage content={content} />;
}
