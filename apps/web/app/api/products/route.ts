import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");

    const products = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        ...(type && { type }),
        ...(featured && { isFeatured: featured === "true" }),
        ...(category && {
          categories: { some: { slug: category } },
        }),
      },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { where: { isActive: true }, take: 1 },
        categories: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: products });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, description, basePrice, categoryIds, images, variants } = body;

    const product = await prisma.product.create({
      data: {
        title,
        slug: title.toLowerCase().replace(/\s+/g, "-"),
        type,
        description,
        basePrice,
        status: "DRAFT",
        categories: categoryIds
          ? { connect: categoryIds.map((id: string) => ({ id })) }
          : undefined,
        images: images ? { create: images } : undefined,
        variants: variants ? { create: variants } : undefined,
      },
      include: { images: true, variants: true, categories: true },
    });

    return NextResponse.json({ ok: true, data: product }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to create product" }, { status: 500 });
  }
}
