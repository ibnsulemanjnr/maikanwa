import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email(),
});

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest) {
  const { email } = Schema.parse(await req.json());
  const normalized = email.toLowerCase().trim();

  // Always return OK to prevent email enumeration
  const okResponse = NextResponse.json({
    ok: true,
    message: "If the email exists, a reset link will be sent.",
  });

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || !user.isActive) return okResponse;

  const rawToken = randomToken();
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const link = `${baseUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(normalized)}`;

  // TEMP: log link (replace with email sender later)
  console.log("[PASSWORD_RESET_LINK]", link);

  return okResponse;
}
