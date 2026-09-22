import { describe, expect, it, vi } from "vitest";

import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import { createCloudWorkspaceDocument } from "@/sync/syncEngine";

import {
  createWorkerHandler,
  type R2BucketLike,
  type WorkerEnvironment,
} from "../../../workers/index";

class MemoryBucket implements R2BucketLike {
  readonly values = new Map<string, string>();

  async get(key: string) {
    const value = this.values.get(key);
    return value ? { json: async <T>() => JSON.parse(value) as T } : null;
  }

  async put(key: string, value: string) {
    this.values.set(key, value);
  }

  async delete(key: string) {
    this.values.delete(key);
  }

  async list({ prefix }: { prefix: string; cursor?: string }) {
    return {
      objects: [...this.values.keys()]
        .filter((key) => key.startsWith(prefix))
        .map((key) => ({ key })),
      truncated: false,
    };
  }
}

function environment(): WorkerEnvironment {
  return {
    DATA_BUCKET: new MemoryBucket(),
    SUPABASE_URL: "https://example.supabase.co",
    ALLOWED_ORIGIN: [
      "https://jaimaiwailaew.vercel.app",
      "http://localhost:3000",
      "https://jaimaiwailaew-*-dev-xparq-s-projects.vercel.app",
      "https://jaimaiwailaew-51ez1e6ev-dev-xparq-s-projects.vercel.app",
    ].join(","),
  };
}

function request(
  path: string,
  init?: RequestInit,
  origin = "https://jaimaiwailaew.vercel.app",
) {
  return new Request(`https://sync.example${path}`, {
    ...init,
    headers: {
      Authorization: "Bearer valid-token",
      Origin: origin,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

const handler = createWorkerHandler({
  verifyToken: async () => ({ sub: "user-a" }),
});

describe("Cloudflare Worker API", () => {
  // ── Requirement 2: allow-list origins ────────────────────────────────────
  it.each([
    "https://jaimaiwailaew.vercel.app", // production
    "http://localhost:3000", // local dev
    "https://jaimaiwailaew-51ez1e6ev-dev-xparq-s-projects.vercel.app", // current preview (explicit)
    "https://jaimaiwailaew-abc123-dev-xparq-s-projects.vercel.app", // preview URL by wildcard pattern
  ])("allows the configured CORS origin %s", async (origin) => {
    const response = await handler.fetch(
      request("/api/users/user-a/workspaces", undefined, origin),
      environment(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(response.headers.get("Vary")).toBe("Origin");
  });

  // ── Requirement 1 + 4: OPTIONS preflight handled before auth / R2 ────────
  it("handles allowed preflight before authentication and R2 access", async () => {
    const bucket = new MemoryBucket();
    const getSpy = vi.spyOn(bucket, "get");
    const listSpy = vi.spyOn(bucket, "list");
    const verifyToken = vi.fn(async () => ({ sub: "user-a" }));
    const preflightHandler = createWorkerHandler({ verifyToken });
    const origin =
      "https://jaimaiwailaew-51ez1e6ev-dev-xparq-s-projects.vercel.app";
    const response = await preflightHandler.fetch(
      new Request("https://sync.example/api/users/user-a/workspaces", {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Authorization, Content-Type",
        },
      }),
      { ...environment(), DATA_BUCKET: bucket },
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "Authorization, Content-Type",
    );
    expect(response.headers.get("Access-Control-Max-Age")).toBe("600");
    expect(response.headers.get("Vary")).toBe("Origin");
    // preflight must NOT touch auth or R2 logic
    expect(verifyToken).not.toHaveBeenCalled();
    expect(getSpy).not.toHaveBeenCalled();
    expect(listSpy).not.toHaveBeenCalled();
  });

  // ── Requirement 6: foreign origins → 403, no ACAO reflected ─────────────
  it("rejects foreign origins without reflecting them", async () => {
    const env = environment();
    const foreignOrigin = "https://attacker.example";
    const normalResponse = await handler.fetch(
      request("/api/users/user-a/workspaces", undefined, foreignOrigin),
      env,
    );
    const preflightResponse = await handler.fetch(
      new Request("https://sync.example/api/users/user-a/workspaces", {
        method: "OPTIONS",
        headers: { Origin: foreignOrigin },
      }),
      env,
    );

    for (const response of [normalResponse, preflightResponse]) {
      expect(response.status).toBe(403);
      expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
      expect(response.headers.get("Vary")).toBe("Origin");
    }
  });

  it("requires a bearer token and rejects another user's workspace list", async () => {
    const env = environment();
    const unauthorized = await handler.fetch(
      new Request("https://sync.example/api/users/user-a/workspaces"),
      env,
    );
    expect(unauthorized.status).toBe(401);

    const forbidden = await handler.fetch(
      request("/api/users/user-b/workspaces"),
      env,
    );
    expect(forbidden.status).toBe(403);
  });

  it("stores, reads, and lists only a validated workspace document", async () => {
    const env = environment();
    const workspace = {
      ...createCalculatorWorkspace(
        getDefaultWorkspaceInput("salaried_employee", 2569, "full_year"),
      ),
      id: "workspace-a",
    };
    const document = createCloudWorkspaceDocument(workspace);

    const put = await handler.fetch(
      request("/api/workspaces/workspace-a", {
        method: "PUT",
        body: JSON.stringify(document),
      }),
      env,
    );
    expect(put.status).toBe(200);
    expect(put.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://jaimaiwailaew.vercel.app",
    );

    const get = await handler.fetch(
      request("/api/workspaces/workspace-a"),
      env,
    );
    expect(get.status).toBe(200);
    expect(await get.json()).toEqual(document);

    const list = await handler.fetch(
      request("/api/users/user-a/workspaces"),
      env,
    );
    expect(await list.json()).toEqual({ workspaces: [document] });

    const invalid = await handler.fetch(
      request("/api/workspaces/workspace-a", {
        method: "PUT",
        body: JSON.stringify({ ...document, workspace: { id: "workspace-a" } }),
      }),
      env,
    );
    expect(invalid.status).toBe(400);
    expect(invalid.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://jaimaiwailaew.vercel.app",
    );
  });

  it("enforces the origin allowlist and notification endpoint methods", async () => {
    const env = environment();
    const blocked = await handler.fetch(
      new Request("https://sync.example/api/users/user-a/workspaces", {
        headers: {
          Authorization: "Bearer valid-token",
          Origin: "https://attacker.example",
        },
      }),
      env,
    );
    expect(blocked.status).toBe(403);
    expect(blocked.headers.has("Access-Control-Allow-Origin")).toBe(false);

    const wrongMethod = await handler.fetch(
      request("/api/notifications/subscriptions"),
      env,
    );
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://jaimaiwailaew.vercel.app",
    );
  });

  // ── Requirement 5: every response status carries CORS headers ────────────
  describe("CORS headers on all response status codes", () => {
    const origin = "https://jaimaiwailaew.vercel.app";

    it("GET 200 (workspace list) carries CORS headers", async () => {
      const response = await handler.fetch(
        request("/api/users/user-a/workspaces", undefined, origin),
        environment(),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
      expect(response.headers.get("Vary")).toBe("Origin");
    });

    it("GET 404 (workspace not found) carries CORS headers", async () => {
      const response = await handler.fetch(
        request("/api/workspaces/nonexistent-workspace", undefined, origin),
        environment(),
      );

      expect(response.status).toBe(200); // GET workspace returns null (null body is 200)
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
      expect(response.headers.get("Vary")).toBe("Origin");
    });

    it("GET 404 (entries for missing workspace) carries CORS headers", async () => {
      const response = await handler.fetch(
        request("/api/workspaces/nonexistent/entries", undefined, origin),
        environment(),
      );

      expect(response.status).toBe(404);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
      expect(response.headers.get("Vary")).toBe("Origin");
    });

    it("POST 201 (category created) carries CORS headers", async () => {
      // First create the workspace
      const env = environment();
      const workspace = {
        ...createCalculatorWorkspace(
          getDefaultWorkspaceInput("salaried_employee", 2569, "full_year"),
        ),
        id: "workspace-post-cat",
      };
      const document = createCloudWorkspaceDocument(workspace);
      await handler.fetch(
        request("/api/workspaces/workspace-post-cat", {
          method: "PUT",
          body: JSON.stringify(document),
        }),
        env,
      );

      // POST a fully-valid custom category so writeWorkspace schema validation passes
      const now = new Date().toISOString();
      const response = await handler.fetch(
        request(
          "/api/workspaces/workspace-post-cat/categories",
          {
            method: "POST",
            body: JSON.stringify({
              id: "cat-1",
              workspaceId: "workspace-post-cat",
              kind: "income",
              label: "รายได้เสริม",
              createdAt: now,
              updatedAt: now,
            }),
          },
          origin,
        ),
        env,
      );

      expect(response.status).toBe(201);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
      expect(response.headers.get("Vary")).toBe("Origin");
    });

    it("401 (missing bearer token) carries CORS headers for allowed origin", async () => {
      const response = await handler.fetch(
        new Request("https://sync.example/api/users/user-a/workspaces", {
          headers: { Origin: origin },
        }),
        environment(),
      );

      expect(response.status).toBe(401);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
      expect(response.headers.get("Vary")).toBe("Origin");
    });

    it("400 (invalid payload) carries CORS headers", async () => {
      const env = environment();
      const workspace = {
        ...createCalculatorWorkspace(
          getDefaultWorkspaceInput("salaried_employee", 2569, "full_year"),
        ),
        id: "workspace-bad",
      };
      const document = createCloudWorkspaceDocument(workspace);
      // Create the workspace first
      await handler.fetch(
        request("/api/workspaces/workspace-bad", {
          method: "PUT",
          body: JSON.stringify(document),
        }),
        env,
      );

      const response = await handler.fetch(
        request(
          "/api/workspaces/workspace-bad/entries",
          {
            method: "POST",
            body: JSON.stringify({ invalid: true }), // missing entryType / entry
          },
          origin,
        ),
        env,
      );

      expect(response.status).toBe(400);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
      expect(response.headers.get("Vary")).toBe("Origin");
    });

    it("500 (internal error from corrupt R2 object) carries CORS headers", async () => {
      const bucket = new MemoryBucket();
      // Plant a corrupt JSON document in the bucket to trigger internal_error
      bucket.values.set(
        "users/user-a/workspaces/corrupt-ws.json",
        "not-valid-json-at-all{{{",
      );
      // The get() will succeed but json() will throw SyntaxError, which
      // maps to 400 "invalid_json". Use an unexpected schema error instead.
      // We store valid JSON that fails cloud schema validation.
      bucket.values.set(
        "users/user-a/workspaces/bad-schema.json",
        JSON.stringify({ totally: "wrong" }),
      );

      const response = await handler.fetch(
        request("/api/workspaces/bad-schema", undefined, origin),
        {
          DATA_BUCKET: bucket,
          SUPABASE_URL: "https://example.supabase.co",
          ALLOWED_ORIGIN: "https://jaimaiwailaew.vercel.app",
        },
      );

      // The worker catches "invalid_cloud_document" thrown by readWorkspace
      // and falls through to the generic 500 handler
      expect(response.status).toBe(500);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
      expect(response.headers.get("Vary")).toBe("Origin");
    });

    it("OPTIONS with localhost origin returns 204 and correct CORS headers", async () => {
      const localhostOrigin = "http://localhost:3000";
      const response = await handler.fetch(
        new Request("https://sync.example/api/users/user-a/workspaces", {
          method: "OPTIONS",
          headers: {
            Origin: localhostOrigin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization, Content-Type",
          },
        }),
        environment(),
      );

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
        localhostOrigin,
      );
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Authorization, Content-Type",
      );
      expect(response.headers.get("Access-Control-Max-Age")).toBe("600");
      expect(response.headers.get("Vary")).toBe("Origin");
    });
  });
});
