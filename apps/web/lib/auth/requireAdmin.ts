// apps/web/lib/auth/requireAdmin.ts
import { NextRequest } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/session";

export async function requireAdmin(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);

  if (!user) {
    const err: any = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }

  if (!user.isActive) {
    const err: any = new Error("FORBIDDEN");
    err.status = 403;
    throw err;
  }

  if (user.role !== "ADMIN") {
    const err: any = new Error("FORBIDDEN");
    err.status = 403;
    throw err;
  }

  return user;
}
