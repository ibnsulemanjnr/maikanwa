import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
        children: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ ok: true, data: categories });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, parentId } = body;

    const category = await prisma.category.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        parentId,
      },
    });

    return NextResponse.json({ ok: true, data: category }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to create category" }, { status: 500 });
  }
}
