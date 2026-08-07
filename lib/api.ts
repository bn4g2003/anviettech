import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    const fields = Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message]));
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ", fields } }, { status: 422 });
  }
  if (error instanceof ApiError) {
    return NextResponse.json({ success: false, error: { code: "REQUEST_ERROR", message: error.message, fields: error.fields } }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Không thể xử lý yêu cầu" } }, { status: 500 });
}

export async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Body JSON không hợp lệ");
  }
}
