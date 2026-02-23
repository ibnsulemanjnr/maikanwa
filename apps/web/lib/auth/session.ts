// apps/web/lib/auth/session.ts
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "mkw_session";
export const SESSION_DAYS = 30;

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function setSessionCookie(res: NextResponse, token: string, expiresAt: Date) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export function getSessionTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export async function createSessionRecord(userId: string, req?: Request) {
  const token = randomToken(32);
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const ip =
    req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req?.headers.get("x-real-ip") ??
    null;
  const userAgent = req?.headers.get("user-agent") ?? null;

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ip,
      userAgent,
    },
  });

  return { token, expiresAt };
}

export async function revokeSessionByToken(token: string) {
  const tokenHash = sha256Hex(token);
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getSessionUserFromRequest(req: Request) {
  const token = getSessionTokenFromRequest(req);
  if (!token) return null;

  const tokenHash = sha256Hex(token);

  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  return session?.user ?? null;
}
