// apps/web/app/api/cart/items/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Prisma, ProductType, CartStatus } from "@prisma/client";
import crypto from "crypto";

export const runtime = "nodejs";

const GUEST_KEY_COOKIE = "mk_guest";
const SESSION_COOKIE_CANDIDATES = [
  "session",
  "sessionToken",
  "maikanwa_session",
  "mk_session",
] as const;

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
type ApiRes<T> = ApiOk<T> | ApiErr;

function json<T>(data: ApiRes<T>, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getSessionToken(req: NextRequest): string | null {
  for (const name of SESSION_COOKIE_CANDIDATES) {
    const v = req.cookies.get(name)?.value;
    if (v && v.trim().length > 10) return v;
  }
  return null;
}

async function getCurrentUserId(req: NextRequest): Promise<string | null> {
  const token = getSessionToken(req);
  if (!token) return null;

  const tokenHash = sha256Hex(token);
  const now = new Date();

  const session = await prisma.session.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
    select: { userId: true },
  });

  return session?.userId ?? null;
}

function parseDecimalQty(input: unknown): Prisma.Decimal | null {
  if (input === null || input === undefined) return null;

  if (typeof input === "number" && Number.isFinite(input)) {
    return new Prisma.Decimal(input.toString());
  }
  if (typeof input === "string" && input.trim().length) {
    const v = input.trim();
    if (!/^\d+(\.\d+)?$/.test(v)) return null;
    return new Prisma.Decimal(v);
  }
  return null;
}

function isIntegerDecimal(d: Prisma.Decimal): boolean {
  return d.mod(1).equals(0);
}

function ensureStepRule(
  qty: Prisma.Decimal,
  minQty?: Prisma.Decimal | null,
  step?: Prisma.Decimal | null,
): { ok: true } | { ok: false; error: string } {
  if (qty.lte(0)) return { ok: false, error: "Quantity must be greater than 0" };
  if (minQty && qty.lt(minQty))
    return { ok: false, error: `Minimum quantity is ${minQty.toString()}` };

  if (step && step.gt(0)) {
    const base = minQty && minQty.gt(0) ? minQty : new Prisma.Decimal(0);
    const diff = qty.sub(base);
    if (!diff.equals(0)) {
      const div = diff.div(step);
      if (!isIntegerDecimal(div)) {
        const minTxt = minQty ? minQty.toString() : "0";
        return {
          ok: false,
          error: `Quantity must follow step rules (min: ${minTxt}, step: ${step.toString()})`,
        };
      }
    }
  }
  return { ok: true };
}

async function getActiveCartId(req: NextRequest): Promise<string | null> {
  const userId = await getCurrentUserId(req);
  if (userId) {
    const cart = await prisma.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    });
    return cart?.id ?? null;
  }

  const guestKey = req.cookies.get(GUEST_KEY_COOKIE)?.value ?? null;
  if (!guestKey) return null;

  const cart = await prisma.cart.findFirst({
    where: { guestKey, userId: null, status: CartStatus.ACTIVE },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });
  return cart?.id ?? null;
}

async function buildCartResponse(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    select: {
      id: true,
      currency: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          quantity: true,
          attachedToCartItemId: true,
          meta: true,
          variant: {
            select: {
              id: true,
              priceKobo: true,
              unit: true,
              product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  type: true,
                  images: {
                    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                    take: 1,
                    select: { url: true },
                  },
                },
              },
              inventory: { select: { quantity: true, reserved: true } },
            },
          },
        },
      },
    },
  });

  if (!cart) return null;

  let subtotalKobo = 0;

  const items = cart.items.map((it) => {
    const lineTotal = new Prisma.Decimal(it.variant.priceKobo).mul(it.quantity);
    const lineTotalKobo = Number(lineTotal.round().toString());
    subtotalKobo += lineTotalKobo;

    const inv = it.variant.inventory;
    let inStock = true;
    if (it.variant.product.type !== ProductType.SERVICE && inv) {
      const available = inv.quantity.sub(inv.reserved);
      inStock = available.greaterThanOrEqualTo(it.quantity);
    }

    return {
      id: it.id,
      quantity: it.quantity.toString(),
      attachedToCartItemId: it.attachedToCartItemId,
      meta: it.meta,
      inStock,
      lineTotalKobo,
      variant: {
        id: it.variant.id,
        priceKobo: it.variant.priceKobo,
        unit: it.variant.unit,
        product: {
          id: it.variant.product.id,
          title: it.variant.product.title,
          slug: it.variant.product.slug,
          type: it.variant.product.type,
          image: it.variant.product.images?.[0]?.url ?? null,
        },
      },
    };
  });

  return { id: cart.id, currency: cart.currency, subtotalKobo, items };
}

// PATCH: update quantity
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cartId = await getActiveCartId(req);
    if (!cartId) return json({ ok: false, error: "Cart not found" }, { status: 404 });

    const body = (await req.json()) as unknown;
    if (!body || typeof body !== "object")
      return json({ ok: false, error: "Invalid payload" }, { status: 400 });

    const qty = parseDecimalQty((body as Record<string, unknown>).quantity);
    if (!qty) return json({ ok: false, error: "quantity is required" }, { status: 400 });

    const item = await prisma.cartItem.findFirst({
      where: { id: params.id, cartId },
      select: { id: true, variantId: true },
    });

    if (!item) return json({ ok: false, error: "Item not found" }, { status: 404 });

    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
      select: {
        isActive: true,
        minQty: true,
        qtyStep: true,
        product: { select: { type: true } },
        inventory: { select: { quantity: true, reserved: true } },
      },
    });

    if (!variant || !variant.isActive) {
      return json({ ok: false, error: "Variant not found" }, { status: 404 });
    }

    if (variant.product.type !== ProductType.FABRIC && !isIntegerDecimal(qty)) {
      return json(
        { ok: false, error: "Quantity must be a whole number for this item" },
        { status: 400 },
      );
    }

    const stepCheck = ensureStepRule(qty, variant.minQty, variant.qtyStep);
    if (!stepCheck.ok) return json({ ok: false, error: stepCheck.error }, { status: 400 });

    if (variant.product.type !== ProductType.SERVICE && variant.inventory) {
      const available = variant.inventory.quantity.sub(variant.inventory.reserved);
      if (qty.gt(available)) {
        return json(
          { ok: false, error: "Requested quantity exceeds available stock" },
          { status: 400 },
        );
      }
    }

    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: qty } });
    await prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });

    const payload = await buildCartResponse(cartId);
    return json({ ok: true, data: payload }, { status: 200 });
  } catch {
    return json({ ok: false, error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE: remove item (+ children attached items)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cartId = await getActiveCartId(req);
    if (!cartId) return json({ ok: false, error: "Cart not found" }, { status: 404 });

    const item = await prisma.cartItem.findFirst({
      where: { id: params.id, cartId },
      select: { id: true },
    });

    if (!item) return json({ ok: false, error: "Item not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { cartId, attachedToCartItemId: item.id } }),
      prisma.cartItem.delete({ where: { id: item.id } }),
      prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } }),
    ]);

    const payload = await buildCartResponse(cartId);
    return json({ ok: true, data: payload }, { status: 200 });
  } catch {
    return json({ ok: false, error: "Failed to remove item" }, { status: 500 });
  }
}
