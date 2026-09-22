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
3. Set `SUPABASE_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
   `FIREBASE_PRIVATE_KEY` as Worker secrets for each named environment.
   Preserve the private key's newline characters. Never expose the service
   account values through a `NEXT_PUBLIC_` variable.
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

## Supabase and Firebase configuration

- Enable Email, Google, and GitHub providers in Supabase.
- Add production and preview `/auth/callback` URLs to the Supabase redirect
  allowlist. Configure the provider callback URL shown by Supabase in the
  Google/GitHub consoles.
- Add the web app in Firebase, enable Cloud Messaging, create a Web Push VAPID
  key, and provide the public Firebase values from `.env.example` to Vercel.
- Generate a Firebase service account for the Worker secrets. Do not commit the
  JSON key file.

## Validation

```sh
npm run worker:typecheck
npm run worker:dev
```

Cloud Sync is opt-in. With missing configuration the web application remains
usable in Local-only mode and shows an explicit unavailable status. Before
production, complete the privacy/legal review and implement account/cloud-data
deletion and an operational retention policy.
