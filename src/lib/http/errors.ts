import { NextResponse } from "next/server";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);
}

export function isCastError(error: unknown): boolean {
  return (
    Boolean(error && typeof error === "object" && "name" in error && error.name === "CastError") ||
    (error instanceof Error && error.name === "CastError")
  );
}

export function errorResponse(error: unknown): NextResponse {
  if (isDuplicateKeyError(error)) {
    return NextResponse.json({ error: "duplicate" }, { status: 409 });
  }
  if (isCastError(error)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}
