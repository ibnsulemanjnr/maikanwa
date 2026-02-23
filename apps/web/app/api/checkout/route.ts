// apps/web/app/api/checkout/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  CartStatus,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  ProductType,
} from "@prisma/client";
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
    where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
    select: { userId: true },
  });

  return session?.userId ?? null;
}

function parsePaymentMethod(v: unknown): OrderPaymentMethod {
  if (v === OrderPaymentMethod.CASH_ON_DELIVERY) return OrderPaymentMethod.CASH_ON_DELIVERY;
  return OrderPaymentMethod.PAYSTACK;
}

function parseString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length ? v.trim() : null;
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

async function getActiveCartForRequest(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  const guestKey = req.cookies.get(GUEST_KEY_COOKIE)?.value ?? null;

  if (userId) {
    const cart = await prisma.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE },
      orderBy: { updatedAt: "desc" },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            variant: {
              include: {
                product: true,
                inventory: true,
              },
            },
          },
        },
      },
    });
    return { cart, userId, guestKey };
  }

  if (!guestKey) return { cart: null, userId: null, guestKey: null };

  const cart = await prisma.cart.findFirst({
    where: { guestKey, userId: null, status: CartStatus.ACTIVE },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            include: {
              product: true,
              inventory: true,
            },
          },
        },
      },
    },
  });

  return { cart, userId: null, guestKey };
}

function buildAddressSnapshotFromRecord(addr: {
  id: string;
  label: string | null;
  fullName: string | null;
  phone: string | null;
  country: string;
  state: string | null;
  city: string | null;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  postalCode: string | null;
}) {
  return {
    id: addr.id,
    label: addr.label,
    fullName: addr.fullName,
    phone: addr.phone,
    country: addr.country,
    state: addr.state,
    city: addr.city,
    addressLine1: addr.addressLine1,
    addressLine2: addr.addressLine2,
    landmark: addr.landmark,
    postalCode: addr.postalCode,
  };
}

// -----------------------------
// GET: Checkout context (cart + shipping methods + addresses)
// -----------------------------
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);

    const [shippingMethods, addresses, cartCtx] = await Promise.all([
      prisma.shippingMethod.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, feeKobo: true, currency: true, rules: true },
      }),
      userId
        ? prisma.address.findMany({
            where: { userId, isActive: true },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
          })
        : Promise.resolve([]),
      getActiveCartForRequest(req),
    ]);

    if (!cartCtx.cart) {
      return json(
        {
          ok: true,
          data: {
            cart: null,
            shippingMethods,
            addresses,
          },
        },
        { status: 200 },
      );
    }

    // compute subtotal server-side
    let subtotalKobo = 0;
    for (const it of cartCtx.cart.items) {
      const qty = it.quantity; // Decimal
      const lineTotal = new Prisma.Decimal(it.variant.priceKobo).mul(qty);
      subtotalKobo += Number(lineTotal.round().toString());
    }

    return json(
      {
        ok: true,
        data: {
          cart: {
            id: cartCtx.cart.id,
            currency: cartCtx.cart.currency,
            subtotalKobo,
            itemsCount: cartCtx.cart.items.length,
          },
          shippingMethods,
          addresses,
        },
      },
      { status: 200 },
    );
  } catch {
    return json({ ok: false, error: "Failed to load checkout context" }, { status: 500 });
  }
}

// -----------------------------
// POST: Create order + init payment (Paystack) or COD
// body:
// {
//   paymentMethod: "PAYSTACK" | "CASH_ON_DELIVERY",
//   addressId?: string,
//   address?: { ...guest address fields... },
//   email?: string (required for guest Paystack init),
//   shippingMethodId?: string,
//   notes?: string
// }
// -----------------------------
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    const { cart } = await getActiveCartForRequest(req);

    if (!cart || cart.items.length === 0) {
      return json({ ok: false, error: "Cart is empty" }, { status: 400 });
    }

    const body = (await req.json()) as unknown;
    if (!body || typeof body !== "object") {
      return json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }
    const b = body as Record<string, unknown>;

    const paymentMethod = parsePaymentMethod(b.paymentMethod);
    const notes = parseString(b.notes);
    const shippingMethodId = parseString(b.shippingMethodId);
    const addressId = parseString(b.addressId);

    // Resolve shipping method
    const shippingMethod = shippingMethodId
      ? await prisma.shippingMethod.findFirst({
          where: { id: shippingMethodId, isActive: true },
          select: { id: true, name: true, feeKobo: true, currency: true, rules: true },
        })
      : null;

    const shippingKobo = shippingMethod?.feeKobo ?? 0;

    // Resolve address snapshot
    let addressSnapshot: Prisma.InputJsonValue | undefined = undefined;

    if (userId && addressId) {
      const addr = await prisma.address.findFirst({
        where: { id: addressId, userId, isActive: true },
      });
      if (!addr) return json({ ok: false, error: "Invalid addressId" }, { status: 400 });
      addressSnapshot = buildAddressSnapshotFromRecord(addr) as Prisma.InputJsonValue;
    } else {
      // guest address input OR logged-in user without saved address
      const addr =
        b.address && typeof b.address === "object" ? (b.address as Record<string, unknown>) : null;
      const addressLine1 = addr ? parseString(addr.addressLine1) : null;
      if (!addressLine1) {
        return json({ ok: false, error: "Address is required" }, { status: 400 });
      }

      addressSnapshot = {
        fullName: parseString(addr?.fullName),
        phone: parseString(addr?.phone),
        country: parseString(addr?.country) ?? "NG",
        state: parseString(addr?.state),
        city: parseString(addr?.city),
        addressLine1,
        addressLine2: parseString(addr?.addressLine2),
        landmark: parseString(addr?.landmark),
        postalCode: parseString(addr?.postalCode),
      } as Prisma.InputJsonValue;
    }

    // Determine payer email for Paystack
    let payerEmail: string | null = null;
    if (paymentMethod === OrderPaymentMethod.PAYSTACK) {
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        payerEmail = user?.email ?? null;
      } else {
        payerEmail = parseString(b.email);
      }

      if (!payerEmail) {
        return json(
          { ok: false, error: "Email is required for Paystack checkout" },
          { status: 400 },
        );
      }
    }

    // Compute subtotal + validate stock + build orderItems
    const currency = cart.currency || "NGN";
    let subtotalKobo = 0;

    const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

    // Reserve updates collected
    const reserveOps: Array<{
      variantId: string;
      qty: Prisma.Decimal;
    }> = [];

    for (const cartItem of cart.items) {
      const variant = cartItem.variant;
      if (!variant || !variant.isActive) {
        return json({ ok: false, error: "Cart contains inactive item" }, { status: 400 });
      }

      const qty = cartItem.quantity;
      if (qty.lte(0))
        return json({ ok: false, error: "Invalid quantity in cart" }, { status: 400 });

      // enforce integer qty for non-fabric items
      if (variant.product.type !== ProductType.FABRIC && !isIntegerDecimal(qty)) {
        return json(
          { ok: false, error: "Non-fabric items must use whole-number quantity" },
          { status: 400 },
        );
      }

      // enforce min/step (especially for fabric)
      const stepCheck = ensureStepRule(qty, variant.minQty, variant.qtyStep);
      if (!stepCheck.ok) return json({ ok: false, error: stepCheck.error }, { status: 400 });

      // stock check + reserve (services bypass)
      if (variant.product.type !== ProductType.SERVICE && variant.inventory) {
        const available = variant.inventory.quantity.sub(variant.inventory.reserved);
        if (qty.gt(available)) {
          return json(
            { ok: false, error: `Insufficient stock for ${variant.product.title}` },
            { status: 400 },
          );
        }

        reserveOps.push({
          variantId: variant.id,
          qty,
        });
      }

      const unitPriceKobo = variant.priceKobo;
      const lineTotal = new Prisma.Decimal(unitPriceKobo).mul(qty);
      const lineTotalKobo = Number(lineTotal.round().toString());

      subtotalKobo += lineTotalKobo;

      orderItemsData.push({
        orderId: "TEMP", // replaced after Order is created (we’ll use create with nested)
        productId: variant.productId,
        variantId: variant.id,
        productType: variant.product.type,
        title: variant.product.title,
        sku: variant.sku ?? null,
        quantity: qty,
        unitPriceKobo,
        lineTotalKobo,
        meta: cartItem.attachedToCartItemId
          ? ({ attachedToCartItemId: cartItem.attachedToCartItemId } as Prisma.InputJsonValue)
          : undefined,
        createdAt: new Date(),
      });
    }

    const totalKobo = subtotalKobo + shippingKobo;

    // Create order atomically + reserve inventory + mark cart ordered + create PaymentTransaction
    const result = await prisma.$transaction(async (tx) => {
      // reserve stock first (so concurrent checkout fails fast)
      for (const op of reserveOps) {
        await tx.inventory.update({
          where: { variantId: op.variantId },
          data: { reserved: { increment: op.qty } },
        });
      }

      const order = await tx.order.create({
        data: {
          userId: userId ?? null,
          status: OrderStatus.PENDING_PAYMENT,
          currency,
          paymentMethod,
          paymentStatus: OrderPaymentStatus.UNPAID,
          amountPaidKobo: 0,
          subtotalKobo,
          shippingKobo,
          totalKobo,
          shippingMethodId: shippingMethod?.id ?? null,
          addressSnapshot: addressSnapshot ?? undefined,
          shippingMethodSnapshot: shippingMethod
            ? ({
                id: shippingMethod.id,
                name: shippingMethod.name,
                feeKobo: shippingMethod.feeKobo,
              } as Prisma.InputJsonValue)
            : undefined,
          notes: notes ?? null,
          items: {
            create: orderItemsData.map((it) => ({
              productId: it.productId,
              variantId: it.variantId,
              productType: it.productType,
              title: it.title,
              sku: it.sku,
              quantity: it.quantity,
              unitPriceKobo: it.unitPriceKobo,
              lineTotalKobo: it.lineTotalKobo,
              meta: it.meta ?? undefined,
            })),
          },
        },
        select: { id: true },
      });

      // mark cart as ordered
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.ORDERED },
      });

      // create payment transaction record (Paystack or COD)
      const reference =
        paymentMethod === OrderPaymentMethod.PAYSTACK
          ? crypto.randomUUID()
          : `cod_${crypto.randomUUID()}`;

      const paymentTx = await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider:
            paymentMethod === OrderPaymentMethod.PAYSTACK
              ? PaymentProvider.PAYSTACK
              : PaymentProvider.CASH_ON_DELIVERY,
          status: PaymentStatus.INITIALIZED,
          reference,
          amountKobo: totalKobo,
          currency,
        },
        select: { id: true, reference: true, provider: true, status: true },
      });

      return { orderId: order.id, paymentTx };
    });

    // If COD, stop here (no external call)
    if (paymentMethod === OrderPaymentMethod.CASH_ON_DELIVERY) {
      return json(
        {
          ok: true,
          data: {
            orderId: result.orderId,
            paymentMethod: OrderPaymentMethod.CASH_ON_DELIVERY,
            paymentReference: result.paymentTx.reference,
            totalKobo,
            message: "Order created. Pay on Delivery will be handled at delivery time.",
          },
        },
        { status: 201 },
      );
    }

    // PAYSTACK initialize
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return json({ ok: false, error: "PAYSTACK_SECRET_KEY is not configured" }, { status: 500 });
    }

    const callbackUrl =
      process.env.PAYSTACK_CALLBACK_URL ||
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout/success`;

    const initPayload = {
      email: payerEmail!,
      amount: totalKobo, // kobo
      reference: result.paymentTx.reference,
      callback_url: callbackUrl,
      metadata: {
        orderId: result.orderId,
        paymentMethod: "PAYSTACK",
      },
    };

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(initPayload),
    });

    const paystackJson = (await paystackRes.json()) as unknown;
    const ok =
      typeof paystackJson === "object" &&
      paystackJson !== null &&
      (paystackJson as Record<string, unknown>).status === true;

    if (!paystackRes.ok || !ok) {
      // keep order pending; admin can reconcile / verify later
      await prisma.paymentTransaction.update({
        where: { reference: result.paymentTx.reference },
        data: { rawInitPayload: initPayload as Prisma.InputJsonValue },
      });

      return json(
        { ok: false, error: "Failed to initialize Paystack transaction" },
        { status: 502 },
      );
    }

    const data = (paystackJson as Record<string, unknown>).data as Record<string, unknown>;
    const authorizationUrl =
      typeof data.authorization_url === "string" ? data.authorization_url : null;

    await prisma.paymentTransaction.update({
      where: { reference: result.paymentTx.reference },
      data: { rawInitPayload: initPayload as Prisma.InputJsonValue },
    });

    if (!authorizationUrl) {
      return json(
        { ok: false, error: "Paystack response missing authorization_url" },
        { status: 502 },
      );
    }

    return json(
      {
        ok: true,
        data: {
          orderId: result.orderId,
          paymentMethod: OrderPaymentMethod.PAYSTACK,
          paymentReference: result.paymentTx.reference,
          authorizationUrl,
          totalKobo,
        },
      },
      { status: 201 },
    );
  } catch {
    return json({ ok: false, error: "Checkout failed" }, { status: 500 });
  }
}
