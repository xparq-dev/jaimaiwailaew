# Phase 1E Cloud Sync Worker

The Worker stores one validated JSON document per Supabase user/workspace in
Cloudflare R2. Every API request requires a Supabase access token; the Worker
verifies its signature against the project's JWKS endpoint and derives the R2
user prefix from the JWT `sub` claim. A client-supplied user ID never selects
another user's storage prefix.

## Provisioning

1. Sign in with `npx wrangler login`.
2. Create separate buckets with `npx wrangler r2 bucket create
jaimaiwailaew-data-preview` and `npx wrangler r2 bucket create
jaimaiwailaew-data`.
3. Set `SUPABASE_URL` as a Worker secret for each named environment.
4. Keep `ALLOWED_ORIGIN` as a comma-separated allow-list. Entries are exact web
   origins unless they contain `*`, which matches one or more letters, digits,
   or hyphens within a single hostname label. Preview allows only this
   project's Vercel deployment pattern, localhost, and the canonical production
   origin. Production uses only the canonical production origin.
5. Run `npm run worker:deploy:preview`, then set the resulting HTTPS origin as
   `NEXT_PUBLIC_CLOUD_SYNC_API_URL` in Vercel's Preview environment. Deploy
   Production only after Preview verification with `npm run
worker:deploy:production`.

Example secret command (run separately for each secret):

```sh
npx wrangler secret put SUPABASE_URL --config workers/wrangler.jsonc --env preview
```

Repeat the secret commands with `--env production` only when the production
rollout is approved. Secrets and bindings are isolated between the two Worker
environments.

## Supabase configuration

- Enable Google and GitHub providers used by the current UI. Email/password authentication is
  outside the completed Phase 1E scope.
- Add production and preview `/auth/callback` URLs to the Supabase redirect
  allowlist. Configure the provider callback URL shown by Supabase in the
  Google/GitHub consoles.

## Validation

```sh
npm run worker:typecheck
npm run worker:dev
```

Cloud Sync is opt-in. With missing configuration the web application remains
usable in Local-only mode and shows an explicit unavailable status.

## Cloud-copy deletion

`DELETE /api/users/:userId/workspaces` removes every R2 object below the
authenticated user's prefix. The route requires the same Supabase bearer token
as the sync routes and rejects a URL user ID that does not match the JWT
subject. It deletes listed objects in batches of at most 1,000 and returns only
the number of deleted objects. The frontend disables sync after success and
keeps all calculator data in Local Storage.

This operation is not Supabase account deletion and has no retention/grace
period. Account deletion, an operational retention policy, audit/consent
governance, and the remaining privacy/legal review require separate scope.

## Phase 5D governance authority

Admin authority and tax-rule workflow history use a separate D1 binding named
`GOVERNANCE_DB`. Preview and Production have different databases. Apply the
versioned migration only to the intended environment and set
`GOVERNANCE_BOOTSTRAP_OWNER_SUB` as a Worker secret; never place the Supabase
user ID in source, Wrangler variables, frontend configuration, or logs.

All `/api/admin/*` routes require a verified Supabase JWT with `aal2`. The
bootstrap owner is immutable through the API. Delegated roles are stored in D1
with optimistic versions, while tax-rule workflow events are append-only and
use an expected-head check. D1 triggers create audit records in the same
database transaction. There is no audit-delete or emergency-access endpoint.

Preview rollout commands (after setting the secret):

```sh
npx wrangler d1 migrations apply GOVERNANCE_DB --config workers/wrangler.jsonc --env preview --remote
npm run worker:deploy:preview
```

Production migration and deployment require separate post-merge approval.
