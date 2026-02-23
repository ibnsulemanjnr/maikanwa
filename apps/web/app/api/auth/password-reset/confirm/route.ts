import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  newPassword: z.string().min(8),
});

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: NextRequest) {
  const body = Schema.parse(await req.json());
  const email = body.email.toLowerCase().trim();
  const tokenHash = sha256Hex(body.token);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.json({ message: "Invalid or expired reset link" }, { status: 400 });
  }

  const tokenRow = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRow) {
    return NextResponse.json({ message: "Invalid or expired reset link" }, { status: 400 });
  }

  const newHash = await hashPassword(body.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await tx.passwordResetToken.update({
      where: { id: tokenRow.id },
      data: { usedAt: new Date() },
    });

    // Optional: revoke all existing sessions so user must log in again
    await tx.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });

  return NextResponse.json({ ok: true });
}
