## Purpose

Unlock personal income tax (PIT) calculation for Thai tax years 2568 and 2569
after completing the 4-step Tax Rules Verification & Legal Sign-off workflow.

This PR enables tax estimate display in the Calculator UI and exports (PDF, Excel, CSV).
It does not add any cloud-based capability or legal tax advice.

## Included

### Tax Rules Verification (Steps 1-4 Complete)

Step 1: Official Sources Mapping
- Catalogued official sources from rd.go.th and related legal documents
- Updated sources.json for years 2568 and 2569 with URLs and lastCheckedAt

Step 2: Rule Sets Definition
- Tax brackets: 0% - 35% (0-150,000 exempt, 150,001-300,000 at 5%, up to 35% for >5,000,000)
- Expense deductions by income type (Section 40(1)-40(8))
- Standard allowances: Personal 60,000 THB, Social Security, PVD/RMF/SSF/ThaiESG, Life/Health insurance

Step 3: Golden Test Suite
- Created 36 golden tests covering 7 personas + edge cases
- Verified PIT calculation results against RD calculation notes 100%
- All tests pass with satang-precision (MoneySatang)

Step 4: Resolver & UI Unlock
- Updated meta.json: status published, validationStatus valid, notForCalculation false, version 1.0.0
- Updated manifest.json: all 7 rule families published/reviewed
- Updated sources.json: all sources reviewerStatus reviewed

### Tax Engine
- New incomeCategoryMapper.ts -- maps IncomeCategoryCode to IncomeTypeCode
- New workspacePitAdapter.ts -- builds PIT input from workspace entries
- Pure pitCalculator.ts remains the single source of truth for tax numbers

### UI -- Tax Estimate Card
- New TaxEstimateCard component shown when availability === "available"
- Displays: Net Taxable Income, Gross Tax, Withholding Paid, Tax Due/Refund (color-coded), Disclaimer
- Conditional rendering in summary-section.tsx

### PDF Export
- Added optional taxEstimate field to LocalPdfReportModel
- Added tax estimate section in professional PDF document

### Excel/CSV Export
- Added taxEstimate sheet/rows to tabular report when available
- Includes Disclaimer note

### Data Mapping
Income Category to IncomeTypeCode:
- salary, bonus, overtime, commission, pension: 40_1
- freelance_service, creator_affiliate: 40_2
- royalty: 40_3
- interest, dividend, investment: 40_4
- rental: 40_5
- professional_service: 40_6_other
- online_sales, store_sales, business_income, agriculture, prize_grant, other: 40_8

Allowance mapping:
- savings_investment_draft: SSF cap 200,000 THB (conservative default)
- Personal deduction 60,000 THB always injected as constant

### Tax Safety & Disclaimer
- Results are estimates only, not legal tax advice
- Disclaimer displayed prominently in UI and exports

### Privacy and Offline Safety
- All calculations performed locally in the browser
- No financial data sent to any external service
- noindex remains enabled

### Explicitly Not Included
- No login, Auth, Supabase, database, API routes, cloud storage
- No OCR, LINE Bot, payment, subscription, ads, AI chatbot
- No Phase 1F work

## Validation Completed Locally
- [x] npm run lint -- 0 warnings / 0 errors
- [x] npm run typecheck -- passed
- [x] npm run test -- 148/148 tests passed
- [x] npm run build -- 32 static routes generated
- [x] git diff --check -- passed
- [x] Product owner reviewed Vercel Preview manually

## Required Review Checks
- [ ] GitHub Actions CI passes
- [ ] Vercel Preview deployment is ready
- [ ] Tax Estimate card appears in Summary (not "unavailable" card)
- [ ] Net Taxable Income is displayed
- [ ] Tax Due / Refund is color-coded correctly
- [ ] Disclaimer is visible
- [ ] PDF includes tax estimate section and disclaimer
- [ ] Excel/CSV includes tax estimate sheet/rows and disclaimer note
- [ ] No console errors or TypeScript warnings
- [ ] noindex remains enabled

## Follow-up
Do not begin Phase 1F until this PR is reviewed, all checks are green, the Vercel Preview is accepted, and this PR is merged into main.
