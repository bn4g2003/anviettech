import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API_MUTATION_SUCCEEDED_EVENT, apiFetch } from "./api-client";

describe("apiFetch", () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("returns a useful API error when an upstream route responds with HTML", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<!DOCTYPE html><title>Not found</title>", { status: 404, headers: { "content-type": "text/html" } })));

    await expect(apiFetch("/api/v1/missing")).rejects.toMatchObject({
      status: 404,
      code: "NON_JSON_RESPONSE",
      message: "API trả về HTML (HTTP 404)",
    });
  });

  it("announces every successful state-changing request so CRM data can refresh", async () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ success: true, data: {} }), { status: 200 })));

    await apiFetch("/api/v1/quotes/quote-1/approve", { method: "POST" });

    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: API_MUTATION_SUCCEEDED_EVENT }));
  });
});
