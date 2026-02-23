import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionRecord, setSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = Schema.parse(await req.json());
  const email = body.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  if (!user.isActive) return NextResponse.json({ message: "Account disabled" }, { status: 403 });

  const ok = await verifyPassword(body.password, user.passwordHash);
  if (!ok) return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });

  const { token, expiresAt } = await createSessionRecord(user.id, req);

  const res = NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
      },
    },
    { status: 200 },
  );
  setSessionCookie(res, token, expiresAt);
  return res;
}
