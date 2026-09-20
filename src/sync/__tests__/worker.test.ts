import { describe, expect, it } from "vitest";

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
    ALLOWED_ORIGIN: "https://jaimaiwailaew.vercel.app",
  };
}

function request(path: string, init?: RequestInit) {
  return new Request(`https://sync.example${path}`, {
    ...init,
    headers: {
      Authorization: "Bearer valid-token",
      Origin: "https://jaimaiwailaew.vercel.app",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

const handler = createWorkerHandler({
  verifyToken: async () => ({ sub: "user-a" }),
});

describe("Cloudflare Worker API", () => {
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

    const wrongMethod = await handler.fetch(
      request("/api/notifications/subscriptions"),
      env,
    );
    expect(wrongMethod.status).toBe(405);
  });
});
