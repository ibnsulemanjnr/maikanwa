// apps/web/lib/utils/apiResponse.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";

type ZodIssue = { path: (string | number)[]; message: string };

export function apiError(error: unknown, defaultMessage = "An error occurred") {
  if (error instanceof ZodError) {
    // Zod v4 uses `issues` (v3 used `errors`)
    const issues = (error as unknown as { issues?: ZodIssue[] }).issues ?? [];
    const first = issues[0];

    const path = first?.path && first.path.length > 0 ? first.path.map(String).join(".") : "input";
    const msg = first?.message || defaultMessage;

    return NextResponse.json({ message: `${path}: ${msg}` }, { status: 400 });
  }

  if (error instanceof Error) {
    return NextResponse.json({ message: error.message || defaultMessage }, { status: 400 });
  }

  return NextResponse.json({ message: defaultMessage }, { status: 500 });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
