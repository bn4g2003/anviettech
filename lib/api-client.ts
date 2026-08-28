export type ApiMeta = { page?: number; pageSize?: number; total?: number; totalPages?: number; [key: string]: unknown };

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

type ApiSuccess<T> = { success: true; data: T; meta?: ApiMeta };
type ApiFailure = { success: false; error: { code: string; message: string; fields?: Record<string, string> } };

const inFlightMutations = new Map<string, Promise<unknown>>();

function mutationKey(path: string, init?: RequestInit) {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || typeof init?.body !== "string") return undefined;
  return `${method}:${path}:${init.body}`;
}

async function sendRequest<T>(path: string, init?: RequestInit): Promise<{ data: T; meta?: ApiMeta }> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });

  if (response.status === 204) return { data: undefined as T };

  if (response.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/dang-nhap")) {
    window.location.href = `/dang-nhap?redirect=${encodeURIComponent(window.location.pathname)}`;
  }

  const body = (await response.json()) as ApiSuccess<T> | ApiFailure;
  if (!response.ok || !body.success) {
    const err = !body.success ? body.error : { code: "REQUEST_ERROR", message: "Yêu cầu thất bại" };
    throw new ApiClientError(err.message, response.status, err.code, err.fields);
  }
  return { data: body.data, meta: body.meta };
}

export function apiFetch<T>(path: string, init?: RequestInit): Promise<{ data: T; meta?: ApiMeta }> {
  const key = mutationKey(path, init);
  if (!key) return sendRequest<T>(path, init);

  const existing = inFlightMutations.get(key) as Promise<{ data: T; meta?: ApiMeta }> | undefined;
  if (existing) return existing;

  const request = sendRequest<T>(path, init).finally(() => inFlightMutations.delete(key));
  inFlightMutations.set(key, request);
  return request;
}

export function toQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
