import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUserFromRequest } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const formattedOrders = orders.map((order) => ({
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalKobo: order.totalKobo,
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      title: item.title,
      productType: item.productType,
      quantity: item.quantity.toString(),
      lineTotalKobo: item.lineTotalKobo,
    })),
  }));

  return NextResponse.json({ ok: true, orders: formattedOrders });
}
