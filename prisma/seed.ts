// prisma/seed.ts
import {
  PrismaClient,
  ProductStatus,
  ProductType,
  LengthUnit,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Convert NGN naira to kobo (minor units)
 * e.g. ₦5,000.00 => 500000
 */
const ngnToKobo = (naira: number) => Math.round(naira * 100);

async function main() {
  // ----------------------------
  // Admin seed
  // ----------------------------
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@maikanwa.com")
    .toLowerCase()
    .trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: UserRole.ADMIN, passwordHash: adminHash, isActive: true },
    create: {
      email: adminEmail,
      role: UserRole.ADMIN,
      passwordHash: adminHash,
      isActive: true,
      fullName: "Maikanwa Admin",
    },
  });

  // ----------------------------
  // Categories
  // ----------------------------
  const categories = [
    { name: "Fabrics", slug: "fabrics" },
    { name: "Ready-made", slug: "ready-made" },
    { name: "Caps", slug: "caps" },
    { name: "Shoes", slug: "shoes" },
    { name: "Tailoring Services", slug: "tailoring-services" },
  ];

  const cats = await Promise.all(
    categories.map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: { name: c.name, isActive: true },
        create: { name: c.name, slug: c.slug, isActive: true },
      })
    )
  );

  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));

  // ----------------------------
  // Fabric product
  // ----------------------------
  const fabric = await prisma.product.upsert({
    where: { slug: "ankara-premium" },
    update: { status: ProductStatus.PUBLISHED },
    create: {
      type: ProductType.FABRIC,
      status: ProductStatus.PUBLISHED,
      title: "Ankara Premium Fabric",
      slug: "ankara-premium",
      currency: "NGN",
      basePriceKobo: ngnToKobo(5000),
      attributes: { fabricType: "Ankara", pattern: "Mixed" },
      categories: { connect: [{ id: catBySlug["fabrics"].id }] },
      images: {
        create: [
          {
            url: "https://placehold.co/800x800?text=Ankara",
            altText: "Ankara fabric",
            sortOrder: 0,
            isPrimary: true,
          },
        ],
      },
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: "FAB-ANKARA-YARD" },
    update: { isActive: true, priceKobo: ngnToKobo(5000) },
    create: {
      productId: fabric.id,
      title: "Per Yard",
      sku: "FAB-ANKARA-YARD",
      unit: LengthUnit.YARD,
      minQty: "1.00",
      qtyStep: "1.00",
      priceKobo: ngnToKobo(5000),
      isActive: true,
      inventory: {
        create: {
          quantity: "120.00",
          reserved: "0.00",
          lowStockAt: "10.00",
        },
      },
    },
  });

  // ----------------------------
  // Ready-made product
  // ----------------------------
  const kaftan = await prisma.product.upsert({
    where: { slug: "mens-kaftan-classic" },
    update: { status: ProductStatus.PUBLISHED },
    create: {
      type: ProductType.READY_MADE,
      status: ProductStatus.PUBLISHED,
      title: "Men's Classic Kaftan",
      slug: "mens-kaftan-classic",
      currency: "NGN",
      categories: { connect: [{ id: catBySlug["ready-made"].id }] },
      images: {
        create: [
          {
            url: "https://placehold.co/800x800?text=Kaftan",
            altText: "Kaftan",
            sortOrder: 0,
            isPrimary: true,
          },
        ],
      },
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: "RM-KAFTAN-M-BLACK" },
    update: { isActive: true, priceKobo: ngnToKobo(25000) },
    create: {
      productId: kaftan.id,
      title: "M / Black",
      sku: "RM-KAFTAN-M-BLACK",
      size: "M",
      color: "Black",
      priceKobo: ngnToKobo(25000),
      isActive: true,
      inventory: {
        create: {
          quantity: "15.00",
          reserved: "0.00",
          lowStockAt: "3.00",
        },
      },
    },
  });

  // ----------------------------
  // Service product (tailoring)
  // ----------------------------
  const service = await prisma.product.upsert({
    where: { slug: "sew-from-fabric" },
    update: { status: ProductStatus.PUBLISHED },
    create: {
      type: ProductType.SERVICE,
      status: ProductStatus.PUBLISHED,
      title: "Sew From Fabric Service",
      slug: "sew-from-fabric",
      currency: "NGN",
      basePriceKobo: ngnToKobo(12000),
      attributes: { serviceType: "SEW_FROM_FABRIC" },
      categories: { connect: [{ id: catBySlug["tailoring-services"].id }] },
      images: {
        create: [
          {
            url: "https://placehold.co/800x800?text=Tailoring",
            altText: "Tailoring",
            sortOrder: 0,
            isPrimary: true,
          },
        ],
      },
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: "SRV-SEW-FABRIC" },
    update: { isActive: true, priceKobo: ngnToKobo(12000) },
    create: {
      productId: service.id,
      title: "Standard Sewing",
      sku: "SRV-SEW-FABRIC",
      priceKobo: ngnToKobo(12000),
      isActive: true,
      // services can be treated as "always available"
      inventory: {
        create: {
          quantity: "999999.00",
          reserved: "0.00",
          lowStockAt: "1.00",
        },
      },
    },
  });

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });