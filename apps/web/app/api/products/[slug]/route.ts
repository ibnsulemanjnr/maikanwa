import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true }, include: { inventory: true } },
        categories: true,
      },
    });

    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: product });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to fetch product" }, { status: 500 });
  }
}
