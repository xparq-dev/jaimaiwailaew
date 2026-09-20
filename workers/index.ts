import { createRemoteJWKSet, jwtVerify } from "jose";
import { ZodError } from "zod";

import {
  cloudWorkspaceDocumentSchema,
  type CloudWorkspaceDocument,
} from "../src/sync/types";
import {
  sendFirebaseNotification,
  type FirebaseWorkerEnvironment,
} from "./firebase";

const MAX_REQUEST_BYTES = 1_048_576;

interface R2ObjectLike {
  json<T>(): Promise<T>;
}

interface R2ListResultLike {
  readonly objects: readonly { readonly key: string }[];
  readonly truncated: boolean;
  readonly cursor?: string;
}

export interface R2BucketLike {
  get(key: string): Promise<R2ObjectLike | null>;
  put(
    key: string,
    value: string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
  list(options: { prefix: string; cursor?: string }): Promise<R2ListResultLike>;
}

export interface WorkerEnvironment extends FirebaseWorkerEnvironment {
  readonly DATA_BUCKET: R2BucketLike;
  readonly SUPABASE_URL: string;
  readonly ALLOWED_ORIGIN?: string;
}

interface WorkerExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

interface MutableWorkspace {
  id: string;
  updatedAt: string;
  incomeEntries: unknown[];
  expenseEntries: unknown[];
  withholdingEntries: unknown[];
  allowanceDraftEntries: unknown[];
  [key: string]: unknown;
}

interface MutableDocument {
  version: 1;
  workspace: MutableWorkspace;
  customCategories: unknown[];
  updatedAt: string;
}

type VerifyToken = (
  token: string,
  env: WorkerEnvironment,
) => Promise<{ sub: string }>;

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCloudDocument(value: unknown): value is CloudWorkspaceDocument {
  return cloudWorkspaceDocumentSchema.safeParse(value).success;
}

function mutableCopy(document: CloudWorkspaceDocument): MutableDocument {
  return JSON.parse(JSON.stringify(document)) as MutableDocument;
}

function encodeKeySegment(value: string) {
  return encodeURIComponent(value);
}

function workspacePrefix(userId: string) {
  return `users/${encodeKeySegment(userId)}/workspaces/`;
}

function workspaceKey(userId: string, workspaceId: string) {
  return `${workspacePrefix(userId)}${encodeKeySegment(workspaceId)}.json`;
}

function notificationKey(userId: string) {
  return `users/${encodeKeySegment(userId)}/notification-subscriptions.json`;
}

function allowedOrigin(request: Request, env: WorkerEnvironment) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  const configured = (env.ALLOWED_ORIGIN ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed = configured.some((pattern) => {
    if (pattern.startsWith("*.")) {
      try {
        return new URL(origin).hostname.endsWith(pattern.slice(1));
      } catch {
        return false;
      }
    }
    return pattern === origin;
  });
  return allowed ? origin : false;
}

function corsHeaders(origin: string | null) {
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null) {
  return Response.json(body, { status, headers: corsHeaders(origin) });
}

async function parseJsonBody(request: Request) {
  const declaredLength = Number(request.headers.get("Content-Length") ?? "0");
  if (declaredLength > MAX_REQUEST_BYTES) {
    throw new Error("payload_too_large");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
    throw new Error("payload_too_large");
  }
  return JSON.parse(text) as unknown;
}

async function verifySupabaseToken(token: string, env: WorkerEnvironment) {
  const supabaseUrl = env.SUPABASE_URL.replace(/\/$/, "");
  let jwks = jwksCache.get(supabaseUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
    );
    jwksCache.set(supabaseUrl, jwks);
  }
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `${supabaseUrl}/auth/v1`,
    audience: "authenticated",
  });
  if (!payload.sub) throw new Error("missing_subject");
  return { sub: payload.sub };
}

async function readWorkspace(
  bucket: R2BucketLike,
  userId: string,
  workspaceId: string,
) {
  const object = await bucket.get(workspaceKey(userId, workspaceId));
  if (!object) return null;
  const value = await object.json<unknown>();
  if (!isCloudDocument(value)) throw new Error("invalid_cloud_document");
  return value;
}

async function writeWorkspace(
  bucket: R2BucketLike,
  userId: string,
  document: CloudWorkspaceDocument,
) {
  const validated = cloudWorkspaceDocumentSchema.parse(document);
  await bucket.put(
    workspaceKey(userId, document.workspace.id),
    JSON.stringify(validated),
    { httpMetadata: { contentType: "application/json" } },
  );
}

async function listWorkspaces(bucket: R2BucketLike, userId: string) {
  const documents: CloudWorkspaceDocument[] = [];
  let cursor: string | undefined;
  do {
    const result = await bucket.list({
      prefix: workspacePrefix(userId),
      ...(cursor ? { cursor } : {}),
    });
    for (const item of result.objects) {
      if (!item.key.endsWith(".json")) continue;
      const object = await bucket.get(item.key);
      const value = object ? await object.json<unknown>() : null;
      if (isCloudDocument(value)) documents.push(value);
    }
    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);
  return documents;
}

function allEntries(document: CloudWorkspaceDocument) {
  return [
    ...document.workspace.incomeEntries,
    ...document.workspace.expenseEntries,
    ...document.workspace.withholdingEntries,
  ];
}

function entryMap(document: CloudWorkspaceDocument | null) {
  const map = new Map<string, string>();
  if (!document) return map;
  for (const entry of allEntries(document)) {
    map.set(entry.id, entry.updatedAt);
  }
  return map;
}

function describeWorkspaceChanges(
  before: CloudWorkspaceDocument | null,
  after: CloudWorkspaceDocument,
) {
  const oldEntries = entryMap(before);
  const newEntries = entryMap(after);
  let added = 0;
  let updated = 0;
  let deleted = 0;
  for (const [id, updatedAt] of newEntries) {
    if (!oldEntries.has(id)) added += 1;
    else if (oldEntries.get(id) !== updatedAt) updated += 1;
  }
  for (const id of oldEntries.keys()) {
    if (!newEntries.has(id)) deleted += 1;
  }
  if (added > 0) return `เพิ่มรายการใหม่ ${added} รายการ`;
  if (updated > 0) return `อัปเดตรายการ ${updated} รายการ`;
  if (deleted > 0) return `ลบรายการ ${deleted} รายการ`;
  return null;
}

async function readNotificationTokens(bucket: R2BucketLike, userId: string) {
  const object = await bucket.get(notificationKey(userId));
  if (!object) return [];
  const body = await object.json<unknown>();
  if (!isRecord(body) || !Array.isArray(body.tokens)) return [];
  return body.tokens.filter(
    (token): token is string => typeof token === "string" && token.length > 0,
  );
}

async function writeNotificationTokens(
  bucket: R2BucketLike,
  userId: string,
  tokens: readonly string[],
) {
  await bucket.put(
    notificationKey(userId),
    JSON.stringify({
      tokens: [...new Set(tokens)],
      updatedAt: new Date().toISOString(),
    }),
    { httpMetadata: { contentType: "application/json" } },
  );
}

async function notifyUser(
  env: WorkerEnvironment,
  userId: string,
  body: string,
) {
  const tokens = await readNotificationTokens(env.DATA_BUCKET, userId);
  await Promise.all(
    tokens.map((token) =>
      sendFirebaseNotification(env, token, {
        title: "ซิงก์ข้อมูลแล้ว",
        body,
        url: "/calculator/summary",
      }),
    ),
  );
}

function requireRecordWithId(value: unknown) {
  return isRecord(value) && typeof value.id === "string" && value.id.length > 0;
}

function updateDocumentTimestamp(document: MutableDocument) {
  const timestamp = new Date().toISOString();
  document.workspace.updatedAt = timestamp;
  document.updatedAt = timestamp;
}

function entryCollection(document: MutableDocument, entryType: string) {
  if (entryType === "income") return document.workspace.incomeEntries;
  if (entryType === "expense") return document.workspace.expenseEntries;
  if (entryType === "withholding") return document.workspace.withholdingEntries;
  return null;
}

export function createWorkerHandler({
  verifyToken = verifySupabaseToken,
}: { readonly verifyToken?: VerifyToken } = {}) {
  return {
    async fetch(
      request: Request,
      env: WorkerEnvironment,
      context?: WorkerExecutionContextLike,
    ): Promise<Response> {
      const originResult = allowedOrigin(request, env);
      if (originResult === false) {
        return jsonResponse({ error: "origin_not_allowed" }, 403, null);
      }
      const origin = originResult;
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(origin),
        });
      }

      const authorization = request.headers.get("Authorization");
      if (!authorization?.startsWith("Bearer ")) {
        return jsonResponse({ error: "authentication_required" }, 401, origin);
      }

      let userId: string;
      try {
        userId = (await verifyToken(authorization.slice("Bearer ".length), env))
          .sub;
      } catch {
        return jsonResponse({ error: "invalid_access_token" }, 401, origin);
      }

      const url = new URL(request.url);
      const pathname = url.pathname.replace(/\/$/, "");

      try {
        const userWorkspaces = pathname.match(
          /^\/api\/users\/([^/]+)\/workspaces$/,
        );
        if (userWorkspaces && request.method === "GET") {
          const requestedUserId = decodeURIComponent(userWorkspaces[1] ?? "");
          if (requestedUserId !== userId) {
            return jsonResponse({ error: "forbidden" }, 403, origin);
          }
          return jsonResponse(
            { workspaces: await listWorkspaces(env.DATA_BUCKET, userId) },
            200,
            origin,
          );
        }

        const workspaceMatch = pathname.match(/^\/api\/workspaces\/([^/]+)$/);
        if (workspaceMatch) {
          const workspaceId = decodeURIComponent(workspaceMatch[1] ?? "");
          if (request.method === "GET") {
            return jsonResponse(
              await readWorkspace(env.DATA_BUCKET, userId, workspaceId),
              200,
              origin,
            );
          }
          if (request.method === "PUT") {
            const value = await parseJsonBody(request);
            if (!isCloudDocument(value) || value.workspace.id !== workspaceId) {
              return jsonResponse({ error: "invalid_workspace" }, 400, origin);
            }
            const previous = await readWorkspace(
              env.DATA_BUCKET,
              userId,
              workspaceId,
            );
            await writeWorkspace(env.DATA_BUCKET, userId, value);
            const notification = describeWorkspaceChanges(previous, value);
            if (notification) {
              const promise = notifyUser(env, userId, notification).catch(
                () => undefined,
              );
              if (context) context.waitUntil(promise);
              else await promise;
            }
            return jsonResponse({ ok: true }, 200, origin);
          }
          if (request.method === "DELETE") {
            await env.DATA_BUCKET.delete(workspaceKey(userId, workspaceId));
            return jsonResponse({ ok: true }, 200, origin);
          }
        }

        const entriesMatch = pathname.match(
          /^\/api\/workspaces\/([^/]+)\/entries$/,
        );
        if (entriesMatch) {
          const workspaceId = decodeURIComponent(entriesMatch[1] ?? "");
          const document = await readWorkspace(
            env.DATA_BUCKET,
            userId,
            workspaceId,
          );
          if (!document) {
            return jsonResponse({ error: "workspace_not_found" }, 404, origin);
          }
          if (request.method === "GET") {
            return jsonResponse({ entries: allEntries(document) }, 200, origin);
          }
          if (request.method === "POST") {
            const body = await parseJsonBody(request);
            if (
              !isRecord(body) ||
              typeof body.entryType !== "string" ||
              !requireRecordWithId(body.entry)
            ) {
              return jsonResponse({ error: "invalid_entry" }, 400, origin);
            }
            const mutable = mutableCopy(document);
            const collection = entryCollection(mutable, body.entryType);
            if (!collection) {
              return jsonResponse({ error: "invalid_entry_type" }, 400, origin);
            }
            collection.push(body.entry);
            updateDocumentTimestamp(mutable);
            await writeWorkspace(
              env.DATA_BUCKET,
              userId,
              mutable as unknown as CloudWorkspaceDocument,
            );
            await notifyUser(env, userId, "เพิ่มรายการใหม่ 1 รายการ").catch(
              () => undefined,
            );
            return jsonResponse({ ok: true }, 201, origin);
          }
        }

        const entryMatch = pathname.match(/^\/api\/entries\/([^/]+)$/);
        if (
          entryMatch &&
          (request.method === "PUT" || request.method === "DELETE")
        ) {
          const entryId = decodeURIComponent(entryMatch[1] ?? "");
          const body = await parseJsonBody(request);
          if (!isRecord(body) || typeof body.workspaceId !== "string") {
            return jsonResponse(
              { error: "workspace_id_required" },
              400,
              origin,
            );
          }
          const document = await readWorkspace(
            env.DATA_BUCKET,
            userId,
            body.workspaceId,
          );
          if (!document) {
            return jsonResponse({ error: "workspace_not_found" }, 404, origin);
          }
          const mutable = mutableCopy(document);
          const collections = [
            mutable.workspace.incomeEntries,
            mutable.workspace.expenseEntries,
            mutable.workspace.withholdingEntries,
          ];
          let found = false;
          for (const collection of collections) {
            const index = collection.findIndex(
              (entry) => isRecord(entry) && entry.id === entryId,
            );
            if (index < 0) continue;
            found = true;
            if (request.method === "DELETE") collection.splice(index, 1);
            else if (requireRecordWithId(body.entry))
              collection[index] = body.entry;
            else return jsonResponse({ error: "invalid_entry" }, 400, origin);
            break;
          }
          if (!found)
            return jsonResponse({ error: "entry_not_found" }, 404, origin);
          updateDocumentTimestamp(mutable);
          await writeWorkspace(
            env.DATA_BUCKET,
            userId,
            mutable as unknown as CloudWorkspaceDocument,
          );
          await notifyUser(
            env,
            userId,
            request.method === "DELETE"
              ? "ลบรายการ 1 รายการ"
              : "อัปเดตรายการ 1 รายการ",
          ).catch(() => undefined);
          return jsonResponse({ ok: true }, 200, origin);
        }

        const categoriesMatch = pathname.match(
          /^\/api\/workspaces\/([^/]+)\/categories$/,
        );
        if (categoriesMatch) {
          const workspaceId = decodeURIComponent(categoriesMatch[1] ?? "");
          const document = await readWorkspace(
            env.DATA_BUCKET,
            userId,
            workspaceId,
          );
          if (!document)
            return jsonResponse({ error: "workspace_not_found" }, 404, origin);
          if (request.method === "GET") {
            return jsonResponse(
              { categories: document.customCategories },
              200,
              origin,
            );
          }
          if (request.method === "POST") {
            const category = await parseJsonBody(request);
            if (!requireRecordWithId(category))
              return jsonResponse({ error: "invalid_category" }, 400, origin);
            const mutable = mutableCopy(document);
            mutable.customCategories.push(category);
            updateDocumentTimestamp(mutable);
            await writeWorkspace(
              env.DATA_BUCKET,
              userId,
              mutable as unknown as CloudWorkspaceDocument,
            );
            return jsonResponse({ ok: true }, 201, origin);
          }
        }

        const categoryMatch = pathname.match(/^\/api\/categories\/([^/]+)$/);
        if (
          categoryMatch &&
          (request.method === "PUT" || request.method === "DELETE")
        ) {
          const categoryId = decodeURIComponent(categoryMatch[1] ?? "");
          const body = await parseJsonBody(request);
          if (!isRecord(body) || typeof body.workspaceId !== "string")
            return jsonResponse(
              { error: "workspace_id_required" },
              400,
              origin,
            );
          const document = await readWorkspace(
            env.DATA_BUCKET,
            userId,
            body.workspaceId,
          );
          if (!document)
            return jsonResponse({ error: "workspace_not_found" }, 404, origin);
          const mutable = mutableCopy(document);
          const index = mutable.customCategories.findIndex(
            (category) => isRecord(category) && category.id === categoryId,
          );
          if (index < 0)
            return jsonResponse({ error: "category_not_found" }, 404, origin);
          if (request.method === "DELETE")
            mutable.customCategories.splice(index, 1);
          else if (requireRecordWithId(body.category))
            mutable.customCategories[index] = body.category;
          else return jsonResponse({ error: "invalid_category" }, 400, origin);
          updateDocumentTimestamp(mutable);
          await writeWorkspace(
            env.DATA_BUCKET,
            userId,
            mutable as unknown as CloudWorkspaceDocument,
          );
          return jsonResponse({ ok: true }, 200, origin);
        }

        const allowancesMatch = pathname.match(
          /^\/api\/workspaces\/([^/]+)\/allowances$/,
        );
        if (allowancesMatch) {
          const workspaceId = decodeURIComponent(allowancesMatch[1] ?? "");
          const document = await readWorkspace(
            env.DATA_BUCKET,
            userId,
            workspaceId,
          );
          if (!document)
            return jsonResponse({ error: "workspace_not_found" }, 404, origin);
          if (request.method === "GET") {
            return jsonResponse(
              { allowances: document.workspace.allowanceDraftEntries },
              200,
              origin,
            );
          }
          if (request.method === "POST") {
            const allowance = await parseJsonBody(request);
            if (!requireRecordWithId(allowance))
              return jsonResponse({ error: "invalid_allowance" }, 400, origin);
            const mutable = mutableCopy(document);
            mutable.workspace.allowanceDraftEntries.push(allowance);
            updateDocumentTimestamp(mutable);
            await writeWorkspace(
              env.DATA_BUCKET,
              userId,
              mutable as unknown as CloudWorkspaceDocument,
            );
            return jsonResponse({ ok: true }, 201, origin);
          }
        }

        const allowanceMatch = pathname.match(/^\/api\/allowances\/([^/]+)$/);
        if (
          allowanceMatch &&
          (request.method === "PUT" || request.method === "DELETE")
        ) {
          const allowanceId = decodeURIComponent(allowanceMatch[1] ?? "");
          const body = await parseJsonBody(request);
          if (!isRecord(body) || typeof body.workspaceId !== "string")
            return jsonResponse(
              { error: "workspace_id_required" },
              400,
              origin,
            );
          const document = await readWorkspace(
            env.DATA_BUCKET,
            userId,
            body.workspaceId,
          );
          if (!document)
            return jsonResponse({ error: "workspace_not_found" }, 404, origin);
          const mutable = mutableCopy(document);
          const index = mutable.workspace.allowanceDraftEntries.findIndex(
            (allowance) => isRecord(allowance) && allowance.id === allowanceId,
          );
          if (index < 0)
            return jsonResponse({ error: "allowance_not_found" }, 404, origin);
          if (request.method === "DELETE")
            mutable.workspace.allowanceDraftEntries.splice(index, 1);
          else if (requireRecordWithId(body.allowance))
            mutable.workspace.allowanceDraftEntries[index] = body.allowance;
          else return jsonResponse({ error: "invalid_allowance" }, 400, origin);
          updateDocumentTimestamp(mutable);
          await writeWorkspace(
            env.DATA_BUCKET,
            userId,
            mutable as unknown as CloudWorkspaceDocument,
          );
          return jsonResponse({ ok: true }, 200, origin);
        }

        if (pathname === "/api/notifications/subscriptions") {
          if (request.method !== "POST" && request.method !== "DELETE") {
            return jsonResponse({ error: "method_not_allowed" }, 405, origin);
          }
          const body = await parseJsonBody(request);
          if (
            !isRecord(body) ||
            typeof body.token !== "string" ||
            body.token.length > 4096
          ) {
            return jsonResponse(
              { error: "invalid_notification_token" },
              400,
              origin,
            );
          }
          const tokens = await readNotificationTokens(env.DATA_BUCKET, userId);
          await writeNotificationTokens(
            env.DATA_BUCKET,
            userId,
            request.method === "DELETE"
              ? tokens.filter((token) => token !== body.token)
              : [...tokens, body.token],
          );
          return jsonResponse({ ok: true }, 200, origin);
        }

        return jsonResponse({ error: "not_found" }, 404, origin);
      } catch (error) {
        if (error instanceof ZodError) {
          return jsonResponse({ error: "invalid_payload" }, 400, origin);
        }
        if (error instanceof SyntaxError) {
          return jsonResponse({ error: "invalid_json" }, 400, origin);
        }
        if (error instanceof Error && error.message === "payload_too_large") {
          return jsonResponse({ error: "payload_too_large" }, 413, origin);
        }
        return jsonResponse({ error: "internal_error" }, 500, origin);
      }
    },
  };
}

export default createWorkerHandler();
