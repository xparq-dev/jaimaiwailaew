import { notFound, redirect } from "next/navigation";

import { AllowanceSectionPage } from "@/components/calculator/allowance-section";
import { ExpenseSectionPage } from "@/components/calculator/expense-section";
import { IncomeSectionPage } from "@/components/calculator/income-section";
import { SummarySectionPage } from "@/components/calculator/summary-section";
import { WithholdingSectionPage } from "@/components/calculator/withholding-section";

const calculatorSections = [
  "income",
  "expenses",
  "withholding-tax",
  "allowances",
  "summary",
  "export-pdf",
] as const;

export function generateStaticParams() {
  return calculatorSections.map((section) => ({ section }));
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
    case "export-pdf":
      redirect("/calculator/summary");
    default:
      notFound();
  }
}
