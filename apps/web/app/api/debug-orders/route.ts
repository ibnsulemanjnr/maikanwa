import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUserFromRequest } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUserFromRequest(req);

  const allOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      userId: true,
      status: true,
      totalKobo: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    currentUser: user ? { id: user.id, email: user.email } : null,
    recentOrders: allOrders,
    userOrders: user ? allOrders.filter((o) => o.userId === user.id) : [],
  });
}
