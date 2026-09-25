import {
  cloudWorkspaceDeletionSchema,
  cloudWorkspaceDocumentSchema,
  cloudWorkspaceListResponseSchema,
  type CloudSyncTransport,
  type CloudWorkspaceDocument,
} from "./types";

const apiUrl = process.env.NEXT_PUBLIC_CLOUD_SYNC_API_URL?.replace(/\/$/, "");
const testMode = process.env.NEXT_PUBLIC_E2E_CLOUD_MODE === "1";
const MOCK_STORAGE_KEY = "jaimaiwailaew:e2e:cloud-workspaces";

export const isCloudSyncConfigured = Boolean(apiUrl) || testMode;

interface ApiErrorBody {
  readonly error?: string;
}

export class CloudSyncApi implements CloudSyncTransport {
  constructor(
    private readonly getAccessToken: () => Promise<string | null>,
    private readonly baseUrl = apiUrl,
  ) {}

  private async request(path: string, init?: RequestInit): Promise<Response> {
    if (!this.baseUrl) {
      throw new Error("ยังไม่ได้ตั้งค่า Cloud Sync API");
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error("กรุณาเข้าสู่ระบบก่อนซิงก์ข้อมูล");
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      let message = `Cloud Sync ล้มเหลว (${response.status})`;
      try {
        const body = (await response.json()) as ApiErrorBody;
        if (body.error) message = body.error;
      } catch {
        // Keep the safe status-only message.
      }
      throw new Error(message);
    }

    return response;
  }

  async listWorkspaceSnapshot(userId: string) {
    const response = await this.request(
      `/api/users/${encodeURIComponent(userId)}/workspaces`,
    );
    return cloudWorkspaceListResponseSchema.parse(await response.json());
  }

  async getWorkspace(workspaceId: string) {
    const response = await this.request(
      `/api/workspaces/${encodeURIComponent(workspaceId)}`,
    );
    const body = (await response.json()) as unknown;
    if (body === null) return null;
    return cloudWorkspaceDocumentSchema.parse(body);
  }

  async putWorkspace(document: CloudWorkspaceDocument) {
    await this.request(
      `/api/workspaces/${encodeURIComponent(document.workspace.id)}`,
      {
        method: "PUT",
        body: JSON.stringify(document),
      },
    );
  }

  async deleteWorkspace(workspaceId: string) {
    const response = await this.request(
      `/api/workspaces/${encodeURIComponent(workspaceId)}`,
      { method: "DELETE" },
    );
    return cloudWorkspaceDeletionSchema.parse(await response.json());
  }
}

class BrowserMockCloudSyncApi implements CloudSyncTransport {
  private read(): CloudWorkspaceDocument[] {
    if (typeof localStorage === "undefined") return [];
    const value = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!value) return [];
    try {
      const parsed = cloudWorkspaceListResponseSchema.safeParse({
        workspaces: JSON.parse(value) as unknown,
      });
      return parsed.success ? parsed.data.workspaces : [];
    } catch {
      localStorage.removeItem(MOCK_STORAGE_KEY);
      return [];
    }
  }

  private write(documents: readonly CloudWorkspaceDocument[]) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(documents));
  }

  private readDeletions() {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(`${MOCK_STORAGE_KEY}:deletions`);
    if (!raw) return [];
    try {
      return cloudWorkspaceListResponseSchema.shape.deletions.parse(
        JSON.parse(raw) as unknown,
      );
    } catch {
      return [];
    }
  }

  async listWorkspaceSnapshot() {
    return { workspaces: this.read(), deletions: this.readDeletions() };
  }

  async getWorkspace(workspaceId: string) {
    return (
      this.read().find((document) => document.workspace.id === workspaceId) ??
      null
    );
  }

  async putWorkspace(document: CloudWorkspaceDocument) {
    if (
      this.readDeletions().some(
        (deletion) => deletion.workspaceId === document.workspace.id,
      )
    ) {
      throw new Error("Workspace นี้ถูกลบแล้ว");
    }
    const documents = this.read().filter(
      (item) => item.workspace.id !== document.workspace.id,
    );
    this.write([...documents, cloudWorkspaceDocumentSchema.parse(document)]);
  }

  async deleteWorkspace(workspaceId: string) {
    const deletion = {
      workspaceId,
      deletedAt: new Date().toISOString(),
    };
    this.write(this.read().filter((item) => item.workspace.id !== workspaceId));
    localStorage.setItem(
      `${MOCK_STORAGE_KEY}:deletions`,
      JSON.stringify([
        ...this.readDeletions().filter(
          (item) => item.workspaceId !== workspaceId,
        ),
        deletion,
      ]),
    );
    return deletion;
  }
}

export function createCloudSyncTransport(
  getAccessToken: () => Promise<string | null>,
): CloudSyncTransport {
  return testMode
    ? new BrowserMockCloudSyncApi()
    : new CloudSyncApi(getAccessToken);
}
