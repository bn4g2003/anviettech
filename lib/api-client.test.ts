import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api-client";

describe("apiFetch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends one request when an identical mutation is clicked repeatedly before it finishes", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const pendingResponse = new Promise<Response>((resolve) => { resolveResponse = resolve; });
    const fetchMock = vi.fn(() => pendingResponse);
    vi.stubGlobal("fetch", fetchMock);

    const first = apiFetch("/api/v1/deals", {
      method: "POST",
      body: JSON.stringify({ title: "Cơ hội mới" }),
    });
    const second = apiFetch("/api/v1/deals", {
      method: "POST",
      body: JSON.stringify({ title: "Cơ hội mới" }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveResponse?.(new Response(JSON.stringify({ success: true, data: { id: "deal-1" } }), { status: 200 }));

    await expect(first).resolves.toEqual({ data: { id: "deal-1" }, meta: undefined });
    await expect(second).resolves.toEqual({ data: { id: "deal-1" }, meta: undefined });
  });
});
