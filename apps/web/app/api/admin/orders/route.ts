import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUserFromRequest } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUserFromRequest(req);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          fullName: true,
        },
      },
    },
  });

  const results = orders.map((order) => ({
    id: order.id,
    orderNumber: order.id.slice(0, 8).toUpperCase(),
    status: order.status,
    total: (order.totalKobo / 100).toFixed(2),
    currency: order.currency,
    customerEmail: order.user?.email || null,
    customerName: order.user?.fullName || null,
    createdAt: order.createdAt.toISOString(),
  }));

  return NextResponse.json({ results });
}
