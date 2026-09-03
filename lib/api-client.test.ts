import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError, apiFetch } from "./api-client";

describe("apiFetch", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("returns a useful API error when an upstream route responds with HTML", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<!DOCTYPE html><title>Not found</title>", { status: 404, headers: { "content-type": "text/html" } })));

    await expect(apiFetch("/api/v1/missing")).rejects.toMatchObject<ApiClientError>({
      status: 404,
      code: "NON_JSON_RESPONSE",
      message: "API trả về HTML (HTTP 404)",
    });
  });
});
