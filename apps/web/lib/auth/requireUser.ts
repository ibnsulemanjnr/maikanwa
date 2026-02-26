// apps/web/lib/auth/requireUser.ts
import { NextRequest } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/session";

/**
 * Requires an authenticated, active user (CUSTOMER or ADMIN).
 * Use this for customer-facing authenticated APIs.
 */
export async function requireUser(req: NextRequest) {
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

  // Allow both CUSTOMER and ADMIN to access "user" endpoints
  return user;
}
