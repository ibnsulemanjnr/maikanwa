// apps/web/app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ProductStatus, ProductType } from "@prisma/client";

export const runtime = "nodejs";

function parseBool(v: string | null): boolean | undefined {
  if (v === null) return undefined;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

function isProductType(v: string | null): v is ProductType {
  return !!v && (Object.values(ProductType) as string[]).includes(v);
}

// -----------------------------
// Google Drive image helpers
// -----------------------------
function extractDriveId(input: string): string | null {
  try {
    const u = new URL(input);
    // drive.google.com
    if (u.hostname.includes("drive.google.com")) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      return m?.[1] ?? u.searchParams.get("id");
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * ✅ Normalizes Drive share/view links into a renderable URL.
 * - If it's not a Drive link, returns as-is.
 * - Uses thumbnail endpoint (works reliably for public files).
 */
function normalizeImageUrl(url: string): string {
  const id = extractDriveId(url);
  if (!id) return url;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;
}

// (POST helpers kept, but GET is what the store needs)
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  for (let i = 0; i < 20; i++) {
    const exists = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now()}`;
}

function toKobo(maybe: unknown): number | null {
  if (maybe === null || maybe === undefined) return null;
  if (typeof maybe === "number" && Number.isFinite(maybe)) return Math.round(maybe * 100);
  if (typeof maybe === "string") {
    const n = Number(maybe);
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const categorySlug = searchParams.get("category");
    const featured = parseBool(searchParams.get("featured"));

    const where = {
      status: ProductStatus.PUBLISHED,
      ...(isProductType(typeParam) ? { type: typeParam } : {}),
      ...(featured !== undefined ? { isFeatured: featured } : {}),
      ...(categorySlug ? { categories: { some: { slug: categorySlug } } } : {}),
    };

    const rows = await prisma.product.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        basePriceKobo: true,
        currency: true,

        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true },
        },

        // ✅ fetch all active variants (minimal fields) so we can compute inStock accurately
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          select: {
            priceKobo: true,
            inventory: { select: { quantity: true, reserved: true } },
          },
        },

        categories: {
          select: { name: true, slug: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const products = rows.map((p) => {
      const inStock =
        p.type === ProductType.SERVICE
          ? true
          : p.variants.length === 0
            ? true // no inventory tracked -> treat as available
            : p.variants.some((v) => {
                const inv = v.inventory;
                if (!inv) return true;
                const available = inv.quantity.sub(inv.reserved);
                return available.greaterThan(0);
              });

      // ✅ Ensure returned image URL is always renderable
      const images = (p.images ?? []).map((img) => ({
        url: normalizeImageUrl(img.url),
      }));

      return {
        ...p,
        images,
        inStock,
      };
    });

    return NextResponse.json({ ok: true, data: products });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

/**
 * NOTE: This POST is not used by admin (you use /api/admin/products),
 * but keeping it here for completeness.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const b = body as Record<string, unknown>;

    const title = typeof b.title === "string" ? b.title.trim() : "";
    const type = typeof b.type === "string" ? b.type : null;
    const description = typeof b.description === "string" ? b.description : null;

    if (!title) {
      return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
    }
    if (!isProductType(type)) {
      return NextResponse.json({ ok: false, error: "Invalid product type" }, { status: 400 });
    }

    const basePriceKobo =
      typeof b.basePriceKobo === "number" ? Math.trunc(b.basePriceKobo) : toKobo(b.basePrice);

    const rawCategoryIds = Array.isArray(b.categoryIds) ? b.categoryIds : [];
    const categoryIds = rawCategoryIds.filter((x): x is string => typeof x === "string");

    const rawImages = Array.isArray(b.images) ? b.images : [];
    const images = rawImages
      .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : null))
      .filter((x): x is Record<string, unknown> => !!x)
      .map((img, idx) => ({
        url: normalizeImageUrl(String(img.url || "")), // ✅ normalize on write too
        altText: typeof img.altText === "string" ? img.altText : null,
        sortOrder: typeof img.sortOrder === "number" ? img.sortOrder : idx,
        isPrimary: typeof img.isPrimary === "boolean" ? img.isPrimary : idx === 0,
      }))
      .filter((img) => img.url.length > 0);

    const rawVariants = Array.isArray(b.variants) ? b.variants : [];
    const variants = rawVariants
      .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : null))
      .filter((x): x is Record<string, unknown> => !!x)
      .map((v) => {
        const priceKobo =
          typeof v.priceKobo === "number" ? Math.trunc(v.priceKobo) : toKobo(v.price);

        return {
          title: typeof v.title === "string" ? v.title : null,
          sku: typeof v.sku === "string" ? v.sku : null,
          size: typeof v.size === "string" ? v.size : null,
          color: typeof v.color === "string" ? v.color : null,
          unit: typeof v.unit === "string" ? v.unit : null,
          minQty: v.minQty ?? null,
          qtyStep: v.qtyStep ?? null,
          priceKobo: priceKobo ?? 0,
          isActive: typeof v.isActive === "boolean" ? v.isActive : true,
        };
      });

    const slugInput = typeof b.slug === "string" ? slugify(b.slug) : "";
    const baseSlug = slugInput || slugify(title);
    const slug = await ensureUniqueSlug(baseSlug);

    const product = await prisma.product.create({
      data: {
        title,
        slug,
        type,
        description,
        basePriceKobo: basePriceKobo ?? null,
        status: ProductStatus.DRAFT,
        categories: categoryIds.length ? { connect: categoryIds.map((id) => ({ id })) } : undefined,
        images: images.length ? { create: images } : undefined,
        variants: variants.length ? { create: variants as never } : undefined,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        basePriceKobo: true,
        images: { select: { url: true, isPrimary: true, sortOrder: true } },
        variants: { select: { id: true, sku: true, priceKobo: true, isActive: true } },
        categories: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ ok: true, data: product }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to create product" }, { status: 500 });
  }
}
