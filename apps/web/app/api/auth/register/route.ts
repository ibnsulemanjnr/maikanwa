import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSessionRecord, setSessionCookie } from "@/lib/auth/session";
import { apiError } from "@/lib/utils/apiResponse";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(32).optional(),
});

export async function POST(req: Request) {
  try {
    const body = Schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "Email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: body.fullName ?? null,
        phone: body.phone ?? null,
        role: "CUSTOMER",
        isActive: true,
      },
      select: { id: true, email: true, role: true, fullName: true, phone: true },
    });

    const { token, expiresAt } = await createSessionRecord(user.id, req);

    const res = NextResponse.json({ user }, { status: 201 });
    setSessionCookie(res, token, expiresAt);
    return res;
  } catch (error) {
    return apiError(error, "Registration failed");
  }
}
