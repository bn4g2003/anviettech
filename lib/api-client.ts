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
export const API_MUTATION_SUCCEEDED_EVENT = "anviet:api-mutation-succeeded";

function isMutation(init?: RequestInit) {
  const method = (init?.method ?? "GET").toUpperCase();
  return method !== "GET" && method !== "HEAD";
}

function announceSuccessfulMutation() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(API_MUTATION_SUCCEEDED_EVENT));
  }
}

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

  const rawBody = await response.text();
  let body: ApiSuccess<T> | ApiFailure;
  try {
    body = JSON.parse(rawBody) as ApiSuccess<T> | ApiFailure;
  } catch {
    const kind = rawBody.trimStart().startsWith("<") ? "HTML" : "dữ liệu không hợp lệ";
    throw new ApiClientError(`API trả về ${kind} (HTTP ${response.status})`, response.status, "NON_JSON_RESPONSE");
  }
  if (!response.ok || !body.success) {
    const err = !body.success ? body.error : { code: "REQUEST_ERROR", message: "Yêu cầu thất bại" };
    throw new ApiClientError(err.message, response.status, err.code, err.fields);
  }
  return { data: body.data, meta: body.meta };
}

export function apiFetch<T>(path: string, init?: RequestInit): Promise<{ data: T; meta?: ApiMeta }> {
  const requestOnce = () => sendRequest<T>(path, init).then((result) => {
    if (isMutation(init)) announceSuccessfulMutation();
    return result;
  });
  const key = mutationKey(path, init);
  if (!key) return requestOnce();

  const existing = inFlightMutations.get(key) as Promise<{ data: T; meta?: ApiMeta }> | undefined;
  if (existing) return existing;

  const request = requestOnce().finally(() => inFlightMutations.delete(key));
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
