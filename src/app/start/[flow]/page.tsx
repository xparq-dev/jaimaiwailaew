import { notFound } from "next/navigation";

import { PlaceholderPage } from "@/components/placeholder-page";
import { startPlaceholders } from "@/content/route-placeholders";

export function generateStaticParams() {
  return Object.keys(startPlaceholders).map((flow) => ({ flow }));
}

export default async function StartFlowPage({
  params,
}: {
  params: Promise<{ flow: string }>;
}) {
  const { flow } = await params;
  const content = startPlaceholders[flow as keyof typeof startPlaceholders];

  if (!content) notFound();

  return <PlaceholderPage content={content} />;
}
