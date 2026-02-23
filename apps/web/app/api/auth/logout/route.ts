import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  getSessionTokenFromRequest,
  revokeSessionByToken,
} from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const token = getSessionTokenFromRequest(req);
  if (token) await revokeSessionByToken(token);

  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
