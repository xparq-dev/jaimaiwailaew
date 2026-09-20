# Phase 1E Cloud Sync Worker

The Worker stores one validated JSON document per Supabase user/workspace in
Cloudflare R2. Every API request requires a Supabase access token; the Worker
verifies its signature against the project's JWKS endpoint and derives the R2
user prefix from the JWT `sub` claim. A client-supplied user ID never selects
another user's storage prefix.

## Provisioning

1. Create `jaimaiwailaew-data` and `jaimaiwailaew-data-preview` R2 buckets, or
   change the names in `wrangler.jsonc`.
2. Set `SUPABASE_URL` as a Worker secret. It must be the same project used by
   the web app.
3. For FCM, set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
   `FIREBASE_PRIVATE_KEY` as Worker secrets. Preserve the private key's newline
   characters. Never expose these values through a `NEXT_PUBLIC_` variable.
4. Set `ALLOWED_ORIGIN` to a comma-separated list of exact web origins. A
   leading `*.` pattern is supported for a controlled preview subdomain, but an
   unrestricted `*.vercel.app` allowlist is not recommended.
5. Run `npm run worker:deploy`, then set the resulting HTTPS origin as
   `NEXT_PUBLIC_CLOUD_SYNC_API_URL` in Vercel.

Example secret command (run separately for each secret):

```sh
npx wrangler secret put SUPABASE_URL --config workers/wrangler.jsonc
```

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
