import { notFound } from "next/navigation";

import { PlaceholderPage } from "@/components/placeholder-page";
import { calculatorPlaceholders } from "@/content/route-placeholders";

export function generateStaticParams() {
  return Object.keys(calculatorPlaceholders).map((section) => ({ section }));
}

export default async function CalculatorSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const content =
    calculatorPlaceholders[section as keyof typeof calculatorPlaceholders];

  if (!content) notFound();

  return <PlaceholderPage content={content} />;
}
