import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown, defaultMessage = "An error occurred") {
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    return NextResponse.json(
      { message: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: defaultMessage }, { status: 500 });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
