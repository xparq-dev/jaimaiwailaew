# Tax Rule Source Review & Verification Workflow

## Overview

Tax rules in **Jai Mai Wai Laew (จ่ายไม่ไหวแล้ว)** are strictly deterministic, versioned, schema-validated, and safe-by-default.
This document details the rule versioning model, fail-closed policy, Money precision policy, source review workflow, and requirements before any tax year can become available for real tax estimation.

---

## 1. Tax Rule Versioning Model

Rule sets are identified by a canonical `ruleSetId` (e.g. `th-pit-2568-placeholder-v0` or `th-pit-2568-v1`) and semantic version (`version`).

- **Immutability**: Once published, a rule set version cannot be modified in-place. Any change to thresholds, rates, or logic requires a new semver release.
- **Rule Resolution**: `resolveTaxRules({ taxYearBE, ruleSetId })` resolves rule sets strictly by Buddhist Era tax year (2568, 2569) and optional rule set ID.
- **Rule Family Manifests**: Each rule family (e.g., `tax_brackets`, `income_types`, `allowance_rules`, `pnd94_rules`, `pnd91_rules`) is defined in a manifest containing evidence levels, review states, and applicability conditions.

---

## 2. Resolver Fail-Closed Policy

The Tax Rule Engine operates under a strict **Fail-Closed Policy**:

1. **Unknown Tax Year**: Any requested tax year not supported in local static registry returns `availability: "unavailable_unknown_tax_year"`.
2. **Invalid Schema**: Any rule metadata or family manifest failing Zod validation returns `availability: "unavailable_invalid_rules"`.
3. **Unverified / Draft / notForCalculation**: Any rule set with `status: "unverified"`, `status: "draft"`, `validationStatus: "unverified"`, or `notForCalculation: true` returns `availability: "unavailable_unverified_rules"`.
4. **Policy Blocked**: Any rule set with `status: "retired"` or `validationStatus: "blocked"` returns `availability: "unavailable_policy_blocked"`.

When rules are unavailable, feature gates for `taxEstimate`, `pnd94Estimate`, and `pnd91Estimate` remain `unavailable_until_verified`, and **NO numeric tax estimate fields** (`taxDue`, `refundAmount`, `finalTax`, `officialTaxPayable`) are returned.

---

## 3. Money Precision and Rounding Policy

Financial calculations are handled exclusively in **integer satang** (`MoneySatang` branded type where 1 Baht = 100 satang):

- **Representation**: `MoneySatang` guarantees safe integer bounds (`Number.MIN_SAFE_INTEGER` to `Number.MAX_SAFE_INTEGER`). Unsafe integers, `NaN`, `Infinity`, or floating-point numbers are rejected.
- **Arithmetic**: Addition (`safeAddMoney`), subtraction (`safeSubtractMoney`), and comparison (`compareMoney`) are exact integer operations. Floating-point arithmetic is strictly forbidden.
- **Decimal Conversion**: Conversion from user decimal input string (e.g., `"1500.50"`) to `MoneySatang` requires an explicit `RoundingPolicy` (`"round"`, `"floor"`, `"ceil"`, `"bankers"`, `"exact_only"`).
- **Negative Amounts**: Negative money amounts are rejected by default unless `allowNegative: true` is explicitly configured.

---

## 4. Source Evidence and Review Workflow

Every tax rule must link to verified official sources before publication:

### Evidence Levels
- `primary_official`: Official law, Revenue Department announcement, royal gazette, or official form.
- `secondary_official`: Official Revenue Department website guide or official press release.
- `professional_review`: Review note signed off by a licensed Thai Tax Auditor / CPA / Tax Lawyer.
- `unverified`: Default state for unverified placeholders.

### Reviewer Statuses
- `not_reviewed`: Source has not been checked.
- `under_review`: Source under professional review.
- `reviewed`: Source validated by qualified expert.
- `rejected`: Source rejected as inaccurate or outdated.

### Requirements to Change Rule Status from `unverified` to `published`
1. All sources must be `primary_official` or `secondary_official` with valid official URLs and `lastCheckedAt` timestamps.
2. Rule set `verificationStatus` must be changed to `verified`.
3. `notForCalculation` must be set to `false`.
4. `taxRuleSetMetadataSchema.parse()` must pass with zero validation errors.
5. Independent sign-off from a certified tax professional.

---

## 5. Data Intentionally NOT Present in Phase 1A

The following legal tax data is **intentionally absent** from repository files in Phase 1A:

- Personal tax bracket ranges and marginal tax rates.
- Standard deduction percentage ceilings and maximum Baht limits.
- Allowance ceilings (personal, spouse, child, parent, insurance, SSF/RMF, ThaiESG, E-Receipt, etc.).
- Filing deadlines (P.N.D. 94 mid-year, P.N.D. 91 / 90 annual deadlines).
- Official tax calculation formula execution logic.

---

## 6. Phase 1A Completion & Gate to Phase 1B (Calculator UX)

Phase 1A Tax Rule Engine implementation is complete with 100% test pass rate.
The system remains in a safe-by-default state where unverified placeholders block all calculation.

**Gate to Phase 1B (Calculator UX)**:
- Approval of Phase 1A codebase and documentation from the Project Owner.
