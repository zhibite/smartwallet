/**
 * 通用响应与错误工具
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return Response.json(
    { ok: true, data },
    { status: 200, ...init },
  );
}

export function fail(message: string, status = 400, code?: string) {
  return Response.json(
    { ok: false, error: { message, code: code ?? null } },
    { status },
  );
}
