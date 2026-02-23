// apps/web/app/api/cart/items/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Prisma, ProductType, CartStatus } from "@prisma/client";
import crypto from "crypto";

export const runtime = "nodejs";

const GUEST_KEY_COOKIE = "mk_guest";

const SESSION_COOKIE_CANDIDATES = [
  "mkw_session",
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
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    select: { userId: true },
  });

  return session?.userId ?? null;
}

function parseDecimalQty(input: unknown): Prisma.Decimal | null {
  if (input === null || input === undefined) return null;

  // allow string or number
  if (typeof input === "number" && Number.isFinite(input)) {
    return new Prisma.Decimal(input.toString());
  }
  if (typeof input === "string" && input.trim().length) {
    // basic sanitize
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

  if (minQty && qty.lt(minQty)) {
    return { ok: false, error: `Minimum quantity is ${minQty.toString()}` };
  }

  if (step && step.gt(0)) {
    const base = minQty && minQty.gt(0) ? minQty : new Prisma.Decimal(0);
    const diff = qty.sub(base);

    // allow exact base
    if (diff.equals(0)) return { ok: true };

    const div = diff.div(step);
    if (!isIntegerDecimal(div)) {
      const minTxt = minQty ? minQty.toString() : "0";
      return {
        ok: false,
        error: `Quantity must follow step rules (min: ${minTxt}, step: ${step.toString()})`,
      };
    }
  }

  return { ok: true };
}

async function mergeCarts(fromCartId: string, toCartId: string) {
  const fromItems = await prisma.cartItem.findMany({
    where: { cartId: fromCartId },
    select: {
      id: true,
      variantId: true,
      quantity: true,
      attachedToCartItemId: true,
      meta: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (fromItems.length === 0) {
    await prisma.cart.delete({ where: { id: fromCartId } });
    return;
  }

  // map old item id -> new/existing item id
  const idMap = new Map<string, string>();

  // 1) move root items first
  for (const item of fromItems.filter((x) => !x.attachedToCartItemId)) {
    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: toCartId,
        variantId: item.variantId,
        attachedToCartItemId: null,
      },
      select: { id: true, quantity: true },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity.add(item.quantity) },
      });
      idMap.set(item.id, existing.id);
    } else {
      const created = await prisma.cartItem.create({
        data: {
          cartId: toCartId,
          variantId: item.variantId,
          quantity: item.quantity,
          meta: item.meta ?? undefined,
        },
        select: { id: true },
      });
      idMap.set(item.id, created.id);
    }
  }

  // 2) move attached items (service attached to fabric etc.)
  for (const item of fromItems.filter((x) => !!x.attachedToCartItemId)) {
    const mappedParent = item.attachedToCartItemId
      ? (idMap.get(item.attachedToCartItemId) ?? null)
      : null;

    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: toCartId,
        variantId: item.variantId,
        attachedToCartItemId: mappedParent,
      },
      select: { id: true, quantity: true },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity.add(item.quantity) },
      });
      idMap.set(item.id, existing.id);
    } else {
      const created = await prisma.cartItem.create({
        data: {
          cartId: toCartId,
          variantId: item.variantId,
          quantity: item.quantity,
          attachedToCartItemId: mappedParent,
          meta: item.meta ?? undefined,
        },
        select: { id: true },
      });
      idMap.set(item.id, created.id);
    }
  }

  // delete old cart (items cascade)
  await prisma.cart.delete({ where: { id: fromCartId } });
}

async function getOrCreateCart(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  const existingGuestKey = req.cookies.get(GUEST_KEY_COOKIE)?.value ?? null;
  const guestKey = existingGuestKey || crypto.randomUUID();

  // If logged in: use user cart, merge guest cart if it exists.
  if (userId) {
    let userCart = await prisma.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!userCart) {
      userCart = await prisma.cart.create({
        data: { userId, status: CartStatus.ACTIVE, currency: "NGN" },
        select: { id: true },
      });
    }

    // merge guest cart (only if exists and belongs to guest)
    if (existingGuestKey) {
      const guestCart = await prisma.cart.findFirst({
        where: { guestKey: existingGuestKey, userId: null, status: CartStatus.ACTIVE },
        select: { id: true },
      });

      if (guestCart && guestCart.id !== userCart.id) {
        await mergeCarts(guestCart.id, userCart.id);
      }
    }

    return { cartId: userCart.id, guestKeyToSet: existingGuestKey ? null : guestKey };
  }

  // Guest: find any cart with this guestKey (regardless of status)
  let cart = await prisma.cart.findUnique({
    where: { guestKey },
    select: { id: true, status: true },
  });

  if (!cart) {
    // Create new cart
    cart = await prisma.cart.create({
      data: { guestKey, status: CartStatus.ACTIVE, currency: "NGN" },
      select: { id: true, status: true },
    });
  } else if (cart.status !== CartStatus.ACTIVE) {
    // Reactivate if cart exists but not active
    await prisma.cart.update({
      where: { id: cart.id },
      data: { status: CartStatus.ACTIVE },
    });
  }

  return { cartId: cart.id, guestKeyToSet: existingGuestKey ? null : guestKey };
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
              inventory: {
                select: { quantity: true, reserved: true },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) return null;

  let subtotalKobo = 0;

  const items = cart.items.map((it) => {
    const qty = it.quantity; // Decimal
    const priceKobo = it.variant.priceKobo;

    // line total = round(priceKobo * qty)
    const lineTotal = new Prisma.Decimal(priceKobo).mul(qty);
    const lineTotalKobo = Number(lineTotal.round().toString());

    subtotalKobo += lineTotalKobo;

    const inv = it.variant.inventory;
    let inStock = true;
    if (it.variant.product.type !== ProductType.SERVICE && inv) {
      const available = inv.quantity.sub(inv.reserved);
      inStock = available.greaterThanOrEqualTo(qty);
    }

    return {
      id: it.id,
      quantity: qty.toString(),
      attachedToCartItemId: it.attachedToCartItemId,
      meta: it.meta,
      inStock,
      lineTotalKobo,
      variant: {
        id: it.variant.id,
        priceKobo,
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

  return {
    id: cart.id,
    currency: cart.currency,
    subtotalKobo,
    items,
  };
}

// -----------------------------
// GET: Fetch current cart
// -----------------------------
export async function GET(req: NextRequest) {
  try {
    const { cartId, guestKeyToSet } = await getOrCreateCart(req);
    const payload = await buildCartResponse(cartId);

    const res = json({ ok: true, data: payload }, { status: 200 });

    if (guestKeyToSet) {
      res.cookies.set({
        name: GUEST_KEY_COOKIE,
        value: guestKeyToSet,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return res;
  } catch {
    return json({ ok: false, error: "Failed to fetch cart" }, { status: 500 });
  }
}

// -----------------------------
// POST: Add item to cart
// body: { variantId, quantity, attachedToCartItemId?, meta? }
// -----------------------------
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    if (!body || typeof body !== "object") {
      return json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const variantId = typeof b.variantId === "string" ? b.variantId : null;
    const qtyDec = parseDecimalQty(b.quantity);

    const attachedToCartItemId =
      typeof b.attachedToCartItemId === "string" ? b.attachedToCartItemId : null;

    if (!variantId) return json({ ok: false, error: "variantId is required" }, { status: 400 });
    if (!qtyDec) return json({ ok: false, error: "quantity is required" }, { status: 400 });

    const { cartId, guestKeyToSet } = await getOrCreateCart(req);

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        isActive: true,
        unit: true,
        minQty: true,
        qtyStep: true,
        priceKobo: true,
        product: { select: { type: true } },
        inventory: { select: { quantity: true, reserved: true } },
      },
    });

    if (!variant || !variant.isActive) {
      return json({ ok: false, error: "Variant not found" }, { status: 404 });
    }

    // non-fabric items should be integers (ready-made/cap/shoe/service)
    if (variant.product.type !== ProductType.FABRIC && !isIntegerDecimal(qtyDec)) {
      return json(
        { ok: false, error: "Quantity must be a whole number for this item" },
        { status: 400 },
      );
    }

    // enforce min/step rules (especially for fabric)
    const stepCheck = ensureStepRule(qtyDec, variant.minQty, variant.qtyStep);
    if (!stepCheck.ok) return json({ ok: false, error: stepCheck.error }, { status: 400 });

    // stock check (services bypass)
    if (variant.product.type !== ProductType.SERVICE && variant.inventory) {
      const available = variant.inventory.quantity.sub(variant.inventory.reserved);
      if (qtyDec.gt(available)) {
        return json(
          { ok: false, error: "Requested quantity exceeds available stock" },
          { status: 400 },
        );
      }
    }

    // ensure attached parent exists in same cart if provided
    if (attachedToCartItemId) {
      const parent = await prisma.cartItem.findFirst({
        where: { id: attachedToCartItemId, cartId },
        select: { id: true },
      });
      if (!parent) {
        return json(
          { ok: false, error: "attachedToCartItemId is invalid for this cart" },
          { status: 400 },
        );
      }
    }

    // upsert-like behavior: combine quantities for same (variantId + attachedToCartItemId)
    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId,
        variantId,
        attachedToCartItemId: attachedToCartItemId ?? null,
      },
      select: { id: true, quantity: true },
    });

    if (existing) {
      const nextQty = existing.quantity.add(qtyDec);

      // re-check stock for combined quantity
      if (variant.product.type !== ProductType.SERVICE && variant.inventory) {
        const available = variant.inventory.quantity.sub(variant.inventory.reserved);
        if (nextQty.gt(available)) {
          return json(
            { ok: false, error: "Requested quantity exceeds available stock" },
            { status: 400 },
          );
        }
      }

      await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: nextQty,
          meta:
            typeof b.meta === "object" && b.meta !== null
              ? (b.meta as Prisma.InputJsonValue)
              : undefined,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId,
          variantId,
          quantity: qtyDec,
          attachedToCartItemId: attachedToCartItemId ?? undefined,
          meta:
            typeof b.meta === "object" && b.meta !== null
              ? (b.meta as Prisma.InputJsonValue)
              : undefined,
        },
      });
    }

    // bump cart updatedAt
    await prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });

    const payload = await buildCartResponse(cartId);
    const res = json({ ok: true, data: payload }, { status: 200 });

    if (guestKeyToSet) {
      res.cookies.set({
        name: GUEST_KEY_COOKIE,
        value: guestKeyToSet,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return res;
  } catch {
    return json({ ok: false, error: "Failed to add item to cart" }, { status: 500 });
  }
}
