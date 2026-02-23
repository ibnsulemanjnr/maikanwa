// apps/web/app/api/products/[slug]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ProductStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        variants: {
          where: { isActive: true },
          include: { inventory: true },
          orderBy: { createdAt: "asc" },
        },
        categories: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!product || product.status !== ProductStatus.PUBLISHED) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: product });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to fetch product" }, { status: 500 });
  }
}
