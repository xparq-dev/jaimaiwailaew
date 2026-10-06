import { notFound } from "next/navigation";

import { OnboardingWizard } from "@/components/calculator/onboarding-wizard";

const validFlows = ["income-type", "pnd94", "pnd91", "multi-income"] as const;
type ValidFlow = (typeof validFlows)[number];

export function generateStaticParams() {
  return validFlows.map((flow) => ({ flow }));
}

export default async function StartFlowPage({
  params,
}: {
  params: Promise<{ flow: string }>;
}) {
  const { flow } = await params;

  if (!validFlows.includes(flow as ValidFlow)) {
    notFound();
  }

  return <OnboardingWizard initialFlow={flow as ValidFlow} />;
}
