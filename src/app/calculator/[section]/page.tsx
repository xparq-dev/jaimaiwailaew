import { notFound } from "next/navigation";

import { AllowanceSectionPage } from "@/components/calculator/allowance-section";
import { ExpenseSectionPage } from "@/components/calculator/expense-section";
import { IncomeSectionPage } from "@/components/calculator/income-section";
import { SummarySectionPage } from "@/components/calculator/summary-section";
import { WithholdingSectionPage } from "@/components/calculator/withholding-section";
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

  switch (section) {
    case "income":
      return <IncomeSectionPage />;
    case "expenses":
      return <ExpenseSectionPage />;
    case "withholding-tax":
      return <WithholdingSectionPage />;
    case "allowances":
      return <AllowanceSectionPage />;
    case "summary":
      return <SummarySectionPage />;
    case "export-pdf": {
      const content = calculatorPlaceholders["export-pdf"];
      return <PlaceholderPage content={content} />;
    }
    default:
      notFound();
  }
}
