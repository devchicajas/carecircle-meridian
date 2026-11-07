/**
 * PlatformSDK.v1 — thin typed client over Meridian governed external APIs.
 * Access is never widened: row-scope, field-RBAC, and tenant clamps stay server-side.
 */

export type PlatformSDKConfig = {
  apiKey: string;
  baseUrl?: string;
  tenant?: string;
  fetchImpl?: typeof fetch;
};

export type ListRecordsOptions = {
  limit?: number;
  offset?: number;
  cursor?: string;
  search?: string;
  filter?: Record<string, string | number | boolean | null | undefined>;
  orderBy?: string;
};

export type ListRecordsResult<T = Record<string, unknown>> = {
  records: T[];
  total?: number;
  nextCursor?: string | null;
  raw: unknown;
};

export type ExportTenantOptions = {
  format?: "json" | "csv";
};

export class PlatformSDKError extends Error {
  status: number;
  code: string;
  detail?: string;
  traceId?: string;

  constructor(input: {
    status: number;
    code: string;
    detail?: string;
    traceId?: string;
    message?: string;
  }) {
    super(input.message ?? input.detail ?? input.code);
    this.name = "PlatformSDKError";
    this.status = input.status;
    this.code = input.code;
    this.detail = input.detail;
    this.traceId = input.traceId;
  }
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapMutationRecord<T = Record<string, unknown>>(payload: unknown): T {
  const obj = asRecord(payload);
  if (obj?.record && typeof obj.record === "object") {
    return obj.record as T;
  }
  if (obj?.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data as T;
  }
  return payload as T;
}

function extractRecords(payload: unknown): {
  records: Record<string, unknown>[];
  total?: number;
  nextCursor?: string | null;
} {
  if (Array.isArray(payload)) {
    return { records: payload as Record<string, unknown>[] };
  }
  const obj = asRecord(payload);
  if (!obj) return { records: [] };

  const candidates = [obj.records, obj.data, obj.items, obj.rows, obj.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return {
        records: candidate as Record<string, unknown>[],
        total:
          typeof obj.total === "number"
            ? obj.total
            : typeof obj.count === "number"
              ? obj.count
              : undefined,
        nextCursor:
          typeof obj.nextCursor === "string"
            ? obj.nextCursor
            : typeof obj.next_cursor === "string"
              ? obj.next_cursor
              : null,
      };
    }
  }

  // Single wrapped record
  if (obj.record && typeof obj.record === "object") {
    return { records: [obj.record as Record<string, unknown>] };
  }

  return { records: [], total: typeof obj.total === "number" ? obj.total : 0 };
}

export class PlatformSDK {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly tenant?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: PlatformSDKConfig) {
    if (!config.apiKey) {
      throw new PlatformSDKError({
        status: 401,
        code: "MISSING_API_KEY",
        detail: "MERIDIAN_API_KEY is required for PlatformSDK.",
      });
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (
      config.baseUrl ?? "https://dev.lightleap.ai/meridian"
    ).replace(/\/$/, "");
    this.tenant = config.tenant;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private async request<T = unknown>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const url = joinUrl(this.baseUrl, path);
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.apiKey}`);
    headers.set("x-meridian-api-key", this.apiKey);
    headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await this.fetchImpl(url, { ...init, headers });
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    if (!response.ok) {
      const problem = asRecord(payload);
      throw new PlatformSDKError({
        status: response.status,
        code:
          (typeof problem?.code === "string" && problem.code) ||
          (response.status === 403 ? "AUTHZ_DENIED" : "HTTP_ERROR"),
        detail:
          (typeof problem?.detail === "string" && problem.detail) ||
          (typeof problem?.title === "string" && problem.title) ||
          response.statusText,
        traceId:
          (typeof problem?.traceId === "string" && problem.traceId) ||
          response.headers.get("x-trace-id") ||
          undefined,
        message:
          (typeof problem?.detail === "string" && problem.detail) ||
          `Meridian request failed (${response.status})`,
      });
    }

    return payload as T;
  }

  /** GET /api/ext/v1/objects/{object} */
  async listRecords<T = Record<string, unknown>>(
    object: string,
    options: ListRecordsOptions = {},
  ): Promise<ListRecordsResult<T>> {
    const params = new URLSearchParams();
    if (options.limit != null) params.set("limit", String(options.limit));
    if (options.offset != null) params.set("offset", String(options.offset));
    if (options.cursor) params.set("cursor", options.cursor);
    if (options.search) params.set("search", options.search);
    if (options.orderBy) params.set("orderBy", options.orderBy);
    if (options.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        if (value == null) continue;
        params.set(key, String(value));
      }
    }

    const qs = params.toString();
    const path = `/api/ext/v1/objects/${encodeURIComponent(object)}${qs ? `?${qs}` : ""}`;
    const raw = await this.request(path, { method: "GET" });
    const extracted = extractRecords(raw);
    return {
      records: extracted.records as T[],
      total: extracted.total,
      nextCursor: extracted.nextCursor,
      raw,
    };
  }

  /** Prefer GET /objects/{object}/{id}; fall back to list scan if GET is not exposed. */
  async getRecord<T = Record<string, unknown>>(
    object: string,
    id: string,
  ): Promise<T> {
    try {
      const raw = await this.request(
        `/api/ext/v1/objects/${encodeURIComponent(object)}/${encodeURIComponent(id)}`,
        { method: "GET" },
      );
      const obj = asRecord(raw);
      if (obj?.record && typeof obj.record === "object") {
        return obj.record as T;
      }
      if (obj?.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
        return obj.data as T;
      }
      return raw as T;
    } catch (err) {
      if (!(err instanceof PlatformSDKError) || err.status !== 405) throw err;
      const { records } = await this.listRecords<T>(object, { limit: 200 });
      const match = records.find((row) => {
        const r = row as Record<string, unknown>;
        return (
          String(r.id ?? "") === id ||
          String(r.Id ?? "") === id ||
          String(r.record_id ?? "") === id ||
          String(r.uuid ?? "") === id
        );
      });
      if (!match) {
        throw new PlatformSDKError({
          status: 404,
          code: "NOT_FOUND",
          detail: `Record ${id} not found on object ${object}.`,
        });
      }
      return match;
    }
  }

  /**
   * POST /api/ext/v1/objects/{object}
   * Meridian Object API expects `{ values, reason? }` — never invent business IDs.
   */
  async createRecord<T = Record<string, unknown>>(
    object: string,
    values: Record<string, unknown>,
    reason?: string,
  ): Promise<T> {
    const body: Record<string, unknown> = { values };
    if (reason) body.reason = reason;
    const raw = await this.request(
      `/api/ext/v1/objects/${encodeURIComponent(object)}`,
      { method: "POST", body: JSON.stringify(body) },
    );
    return unwrapMutationRecord<T>(raw);
  }

  /**
   * PATCH /api/ext/v1/objects/{object}/{id}
   * Body shape: `{ values, reason? }` per OpenAPI.
   */
  async updateRecord<T = Record<string, unknown>>(
    object: string,
    id: string,
    values: Record<string, unknown>,
    reason?: string,
  ): Promise<T> {
    const body: Record<string, unknown> = { values };
    if (reason) body.reason = reason;
    const raw = await this.request(
      `/api/ext/v1/objects/${encodeURIComponent(object)}/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
    return unwrapMutationRecord<T>(raw);
  }

  /** GET /api/ext/v1/reports */
  async listReports(): Promise<unknown> {
    return this.request("/api/ext/v1/reports", { method: "GET" });
  }

  /** GET /api/ext/v1/reports/{report} */
  async runReport(report: string, query: Record<string, string> = {}) {
    const params = new URLSearchParams(query);
    const qs = params.toString();
    return this.request(
      `/api/ext/v1/reports/${encodeURIComponent(report)}${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    );
  }

  /** GET /api/ext/v1/export — typically admin-scoped */
  async exportTenant(options: ExportTenantOptions = {}) {
    const params = new URLSearchParams();
    if (options.format) params.set("format", options.format);
    const qs = params.toString();
    return this.request(`/api/ext/v1/export${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  }

  /** Protected OpenAPI for this tenant */
  async getOpenApi() {
    const params = new URLSearchParams();
    if (this.tenant) params.set("tenant", this.tenant);
    const qs = params.toString();
    return this.request(`/api/ext/v1/openapi${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  }
}

export function createPlatformSDKFromEnv() {
  const apiKey = process.env.MERIDIAN_API_KEY?.trim();
  if (!apiKey) return null;
  return new PlatformSDK({
    apiKey,
    baseUrl: process.env.MERIDIAN_BASE_URL || "https://dev.lightleap.ai/meridian",
    tenant:
      process.env.MERIDIAN_TENANT ||
      "build-90f628cf19f2414abab1bb2cea64614189",
  });
}
