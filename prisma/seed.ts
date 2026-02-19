import { PrismaClient, ProductStatus, ProductType, LengthUnit } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Fabrics', slug: 'fabrics' },
    { name: 'Ready-made', slug: 'ready-made' },
    { name: 'Caps', slug: 'caps' },
    { name: 'Shoes', slug: 'shoes' },
    { name: 'Tailoring Services', slug: 'tailoring-services' },
  ];

  const cats = await Promise.all(
    categories.map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: { name: c.name, isActive: true },
        create: { name: c.name, slug: c.slug, isActive: true },
      }),
    ),
  );

  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));

  // Fabric product
  const fabric = await prisma.product.upsert({
    where: { slug: 'ankara-premium' },
    update: { status: ProductStatus.PUBLISHED },
    create: {
      type: ProductType.FABRIC,
      status: ProductStatus.PUBLISHED,
      title: 'Ankara Premium Fabric',
      slug: 'ankara-premium',
      basePrice: '5000.00',
      attributes: { fabricType: 'Ankara', pattern: 'Mixed' },
      categories: { connect: [{ id: catBySlug['fabrics'].id }] },
      images: {
        create: [{ url: 'https://placehold.co/800x800?text=Ankara', altText: 'Ankara fabric', sortOrder: 0 }],
      },
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: 'FAB-ANKARA-YARD' },
    update: { isActive: true, price: '5000.00' },
    create: {
      productId: fabric.id,
      title: 'Per Yard',
      sku: 'FAB-ANKARA-YARD',
      unit: LengthUnit.YARD,
      minQty: '1.00',
      qtyStep: '1.00',
      price: '5000.00',
      isActive: true,
      inventory: { create: { quantity: 120, lowStockAt: 10 } },
    },
  });

  // Ready-made product
  const kaftan = await prisma.product.upsert({
    where: { slug: 'mens-kaftan-classic' },
    update: { status: ProductStatus.PUBLISHED },
    create: {
      type: ProductType.READY_MADE,
      status: ProductStatus.PUBLISHED,
      title: "Men's Classic Kaftan",
      slug: 'mens-kaftan-classic',
      categories: { connect: [{ id: catBySlug['ready-made'].id }] },
      images: { create: [{ url: 'https://placehold.co/800x800?text=Kaftan', altText: 'Kaftan', sortOrder: 0 }] },
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: 'RM-KAFTAN-M-BLACK' },
    update: { isActive: true, price: '25000.00' },
    create: {
      productId: kaftan.id,
      title: 'M / Black',
      sku: 'RM-KAFTAN-M-BLACK',
      size: 'M',
      color: 'Black',
      price: '25000.00',
      isActive: true,
      inventory: { create: { quantity: 15, lowStockAt: 3 } },
    },
  });

  // Service product (tailoring)
  const service = await prisma.product.upsert({
    where: { slug: 'sew-from-fabric' },
    update: { status: ProductStatus.PUBLISHED },
    create: {
      type: ProductType.SERVICE,
      status: ProductStatus.PUBLISHED,
      title: 'Sew From Fabric Service',
      slug: 'sew-from-fabric',
      basePrice: '12000.00',
      attributes: { serviceType: 'SEW_FROM_FABRIC' },
      categories: { connect: [{ id: catBySlug['tailoring-services'].id }] },
      images: { create: [{ url: 'https://placehold.co/800x800?text=Tailoring', altText: 'Tailoring', sortOrder: 0 }] },
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: 'SRV-SEW-FABRIC' },
    update: { isActive: true, price: '12000.00' },
    create: {
      productId: service.id,
      title: 'Standard Sewing',
      sku: 'SRV-SEW-FABRIC',
      price: '12000.00',
      isActive: true,
      inventory: { create: { quantity: 999999, lowStockAt: 1 } },
    },
  });

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
