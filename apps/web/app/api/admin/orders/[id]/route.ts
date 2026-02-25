// apps/web/app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { apiError } from "@/lib/utils/apiResponse";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function isUuidLike(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function isShortOrderCode(s: string) {
  return /^[0-9a-f]{8}$/i.test(s);
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(req);

    const { id: raw } = await ctx.params;
    const id = (raw || "").trim();

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing order id" }, { status: 400 });
    }

    // ✅ Support:
    // - full UUID
    // - short code like BA9F327F (first 8 of uuid)
    const where = isUuidLike(id)
      ? { id }
      : isShortOrderCode(id)
        ? { id: { startsWith: id.toLowerCase() } }
        : null;

    if (!where) {
      return NextResponse.json({ ok: false, error: "Invalid order id" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, title: true, slug: true, type: true } },
            variant: {
              select: { id: true, title: true, sku: true, size: true, color: true, unit: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        payments: { orderBy: { createdAt: "desc" } },
        tailoringJobs: {
          include: { attachments: true, link: true },
          orderBy: { createdAt: "asc" },
        },
        shippingMethod: true,
      },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const orderNumber = order.id.slice(0, 8).toUpperCase();

    return NextResponse.json({
      ok: true,
      data: {
        ...order,
        orderNumber,
      },
    });
  } catch (error) {
    return apiError(error, "Failed to fetch order");
  }
}
