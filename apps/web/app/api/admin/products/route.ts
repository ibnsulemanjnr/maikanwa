// apps/web/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { apiError } from "@/lib/utils/apiResponse";

export const runtime = "nodejs";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// -------------------------
// Drive URL normalization
// -------------------------
function extractDriveId(input: string): string | null {
  try {
    const u = new URL(input);
    if (!u.hostname.includes("drive.google.com")) return null;

    // /file/d/<id>/view
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m?.[1]) return m[1];

    // open?id=<id> / uc?id=<id>
    const id = u.searchParams.get("id");
    return id || null;
  } catch {
    return null;
  }
}

/**
 * Convert Drive share/view links into an image-renderable URL.
 * NOTE: This still requires the Drive file to be public (Anyone with link).
 */
function normalizeImageUrl(url: string): string {
  const id = extractDriveId(url);
  if (!id) return url;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;
}

// -------------------------
// Zod schemas
// -------------------------
const VariantSchema = z.object({
  title: z.string().max(160).optional(),
  sku: z.string().max(80).optional(),
  price: z.coerce.number().min(0),
  isActive: z.boolean().optional().default(true),

  // ready-made/cap/shoe
  size: z.string().max(40).optional(),
  color: z.string().max(40).optional(),

  // fabric
  unit: z.enum(["METER", "YARD", "PIECE"]).optional(),
  minQty: z.coerce.number().optional(),
  qtyStep: z.coerce.number().optional(),

  // inventory
  // ✅ allow decimals (your DB Inventory.quantity is Decimal)
  inventoryQty: z.coerce.number().min(0).optional(),
  lowStockAt: z.coerce.number().min(0).optional(),
});

const ImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(160).optional(),
  sortOrder: z.number().optional(),
  isPrimary: z.boolean().optional(),
});

const CreateProductSchema = z.object({
  title: z.string().min(2).max(180),
  slug: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  type: z.enum(["FABRIC", "READY_MADE", "CAP", "SHOE", "SERVICE"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  currency: z.string().max(8).default("NGN"),
  basePrice: z.coerce.number().optional(),
  attributes: z.unknown().optional(),

  categoryIds: z.array(z.string().uuid()).default([]),

  // ✅ supports BOTH shapes (robust)
  imageUrls: z.array(z.string().url()).optional().default([]),
  images: z.array(ImageSchema).optional(),

  variants: z.array(VariantSchema).min(1),
});

export async function GET(req: NextRequest) {
  await requireAdmin(req);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";

  const products = await prisma.product.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
              { variants: { some: { sku: { contains: q, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
      ...(type ? { type: type as any } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { inventory: true } },
      categories: true,
    },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ results: products });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = CreateProductSchema.parse(await req.json());

    const finalSlug = body.slug?.trim() ? slugify(body.slug) : slugify(body.title);

    // FABRIC variant rules
    if (body.type === "FABRIC") {
      for (const v of body.variants) {
        if (!v.unit || v.minQty === undefined || v.qtyStep === undefined) {
          return NextResponse.json(
            { message: "Fabric variants must include unit, minQty, and qtyStep." },
            { status: 400 },
          );
        }
      }
    }

    // Ensure slug unique
    const exists = await prisma.product.findUnique({ where: { slug: finalSlug } });
    if (exists) {
      return NextResponse.json(
        { message: "Slug already exists. Please change it." },
        { status: 409 },
      );
    }

    // Prisma JSON
    const attributesValue =
      body.attributes === undefined
        ? undefined
        : body.attributes === null
          ? Prisma.DbNull
          : (body.attributes as Prisma.InputJsonValue);

    // ✅ Resolve image URLs from either field
    const resolved =
      body.imageUrls && body.imageUrls.length > 0
        ? body.imageUrls
        : (body.images ?? []).map((i) => i.url);

    // Normalize + keep order (and allow sortOrder if provided)
    const fromImages = (body.images ?? []).length > 0;
    const ordered = fromImages
      ? [...(body.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      : resolved.map((url) => ({ url }));

    const normalized = ordered
      .map((img, idx) => ({
        url: normalizeImageUrl(img.url),
        altText: (img as any).altText ?? body.title,
        sortOrder: idx,
        isPrimary: Boolean((img as any).isPrimary),
      }))
      .filter((x) => !!x.url);

    // Ensure exactly one primary
    const primaryIndex = normalized.findIndex((x) => x.isPrimary);
    normalized.forEach((x, idx) => {
      x.isPrimary = primaryIndex >= 0 ? idx === primaryIndex : idx === 0;
    });

    const product = await prisma.product.create({
      data: {
        title: body.title,
        slug: finalSlug,
        description: body.description ?? null,
        type: body.type,
        status: body.status,
        currency: body.currency,
        basePriceKobo: body.basePrice !== undefined ? Math.round(body.basePrice * 100) : null,
        attributes: attributesValue,

        categories: body.categoryIds.length
          ? { connect: body.categoryIds.map((id) => ({ id })) }
          : undefined,

        images: normalized.length
          ? {
              create: normalized.map((img) => ({
                url: img.url,
                altText: img.altText,
                sortOrder: img.sortOrder,
                isPrimary: img.isPrimary,
              })),
            }
          : undefined,

        variants: {
          create: body.variants.map((v) => ({
            title: v.title ?? null,
            sku: v.sku ?? null,
            priceKobo: Math.round(v.price * 100),
            isActive: v.isActive ?? true,

            size: v.size ?? null,
            color: v.color ?? null,

            unit: v.unit ?? null,
            minQty: v.minQty ?? null,
            qtyStep: v.qtyStep ?? null,

            inventory:
              v.inventoryQty !== undefined
                ? {
                    create: {
                      quantity: v.inventoryQty,
                      lowStockAt: v.lowStockAt ?? 5,
                    },
                  }
                : undefined,
          })),
        },
      },
      include: {
        images: true,
        variants: { include: { inventory: true } },
        categories: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return apiError(error, "Invalid request");
  }
}
