/**
 * 客户端 fetch helper：统一处理 ok/error envelope
 */
export type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code: string | null } };

async function call<T>(
  input: string,
  init: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    credentials: "include",
  });
  let body: ApiEnvelope<T>;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    return {
      ok: false,
      error: { message: `HTTP ${res.status}`, code: null },
    };
  }
  return body;
}

export const api = {
  get: <T,>(path: string) => call<T>(path),
  post: <T,>(path: string, data?: unknown) =>
    call<T>(path, {
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  patch: <T,>(path: string, data?: unknown) =>
    call<T>(path, {
      method: "PATCH",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  delete: <T,>(path: string) => call<T>(path, { method: "DELETE" }),
};
