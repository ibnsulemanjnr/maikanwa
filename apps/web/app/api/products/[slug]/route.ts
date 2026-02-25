// apps/web/app/api/products/[slug]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ProductStatus, ProductType } from "@prisma/client";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

// (optional) normalize drive view links to renderable images
function extractDriveId(input: string): string | null {
  try {
    const u = new URL(input);
    if (!u.hostname.includes("drive.google.com")) return null;

    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m?.[1]) return m[1];

    return u.searchParams.get("id");
  } catch {
    return null;
  }
}
function normalizeImageUrl(url: string): string {
  const id = extractDriveId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w2000` : url;
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;

    if (!slug) {
      return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
    }

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

    const variantsWithStock = product.variants.map((v) => {
      if (product.type === ProductType.SERVICE) {
        return { ...v, availableQty: null as string | null, inStock: true };
      }

      const inv = v.inventory;
      if (!inv) {
        return { ...v, availableQty: null as string | null, inStock: true };
      }

      const available = inv.quantity.sub(inv.reserved);
      return { ...v, availableQty: available.toString(), inStock: available.greaterThan(0) };
    });

    const productInStock =
      product.type === ProductType.SERVICE
        ? true
        : variantsWithStock.some((v) => (v as any).inStock);

    return NextResponse.json({
      ok: true,
      data: {
        ...product,
        images: product.images.map((img) => ({ ...img, url: normalizeImageUrl(img.url) })),
        variants: variantsWithStock,
        inStock: productInStock,
      },
    });
  } catch (e) {
    console.error("GET /api/products/[slug] failed:", e);
    return NextResponse.json({ ok: false, error: "Failed to fetch product" }, { status: 500 });
  }
}
