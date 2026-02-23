import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("mkw_session")?.value;
  if (!token) return NextResponse.json({ user: null });

  const tokenHash = sha256Hex(token);

  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session?.user) return NextResponse.json({ user: null });

  const u = session.user;
  return NextResponse.json({
    user: {
      id: u.id,
      email: u.email,
      role: u.role,
      fullName: u.fullName,
      phone: u.phone,
    },
  });
}
