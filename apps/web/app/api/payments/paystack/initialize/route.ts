// apps/web/app/api/payments/paystack/initialize/route.ts
import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import cryptoNode from "crypto";

export const runtime = "nodejs";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
type ApiRes<T> = ApiOk<T> | ApiErr;

function json<T>(data: ApiRes<T>, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

const SESSION_COOKIE_CANDIDATES = [
  "session",
  "sessionToken",
  "maikanwa_session",
  "mk_session",
] as const;

function sha256Hex(input: string) {
  return cryptoNode.createHash("sha256").update(input).digest("hex");
}

function getSessionToken(req: NextRequest): string | null {
  for (const name of SESSION_COOKIE_CANDIDATES) {
    const v = req.cookies.get(name)?.value;
    if (v && v.trim().length > 10) return v;
  }
  return null;
}

async function getAuthContext(
  req: NextRequest,
): Promise<{ userId: string; role: "CUSTOMER" | "ADMIN" } | null> {
  const token = getSessionToken(req);
  if (!token) return null;

  const tokenHash = sha256Hex(token);
  const now = new Date();

  const session = await prisma.session.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
    select: { userId: true },
  });

  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true },
  });

  if (!user) return null;
  return { userId: user.id, role: user.role };
}

function parseString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length ? v.trim() : null;
}

export async function GET() {
  return json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}

/**
 * POST body:
 * {
 *   orderId: string,
 *   callbackUrl?: string
 * }
 *
 * Notes:
 * - Requires auth (CUSTOMER owns the order OR ADMIN).
 * - For guest orders, we currently require login as ADMIN to re-init (ownership cannot be proven safely).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as unknown;
    if (!body || typeof body !== "object") {
      return json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const orderId = parseString(b.orderId);
    const callbackUrlOverride = parseString(b.callbackUrl);

    if (!orderId) return json({ ok: false, error: "orderId is required" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        currency: true,
        totalKobo: true,
        paymentMethod: true,
        paymentStatus: true,
      },
    });

    if (!order) return json({ ok: false, error: "Order not found" }, { status: 404 });

    // Ownership / access control
    if (auth.role !== "ADMIN") {
      if (!order.userId || order.userId !== auth.userId) {
        return json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
    }

    // Only for Paystack orders
    if (order.paymentMethod !== OrderPaymentMethod.PAYSTACK) {
      return json({ ok: false, error: "Order is not Paystack payment method" }, { status: 400 });
    }

    // Already paid -> idempotent
    if (
      order.paymentStatus === OrderPaymentStatus.PAID ||
      order.status === OrderStatus.PROCESSING ||
      order.status === OrderStatus.PAID
    ) {
      return json(
        {
          ok: true,
          data: {
            orderId: order.id,
            alreadyPaid: true,
          },
        },
        { status: 200 },
      );
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret)
      return json({ ok: false, error: "PAYSTACK_SECRET_KEY not configured" }, { status: 500 });

    // Determine payer email from user (required by Paystack)
    const payer = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true },
    });

    if (!payer?.email) {
      return json({ ok: false, error: "User email not found" }, { status: 400 });
    }

    // Reuse an existing INITIALIZED Paystack transaction if one exists, else create new
    const existing = await prisma.paymentTransaction.findFirst({
      where: {
        orderId: order.id,
        provider: PaymentProvider.PAYSTACK,
        status: PaymentStatus.INITIALIZED,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, reference: true },
    });

    const reference = existing?.reference ?? crypto.randomUUID();

    if (!existing) {
      await prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: PaymentProvider.PAYSTACK,
          status: PaymentStatus.INITIALIZED,
          reference,
          amountKobo: order.totalKobo,
          currency: order.currency ?? "NGN",
        },
      });
    }

    const callbackUrl =
      callbackUrlOverride ||
      process.env.PAYSTACK_CALLBACK_URL ||
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout/success`;

    const initPayload = {
      email: payer.email,
      amount: order.totalKobo, // kobo
      reference,
      callback_url: callbackUrl,
      metadata: { orderId: order.id, paymentMethod: "PAYSTACK" },
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

    // store init payload regardless (helps debug)
    await prisma.paymentTransaction.update({
      where: { reference },
      data: { rawInitPayload: initPayload as any },
    });

    if (!paystackRes.ok || !ok) {
      return json(
        { ok: false, error: "Failed to initialize Paystack transaction" },
        { status: 502 },
      );
    }

    const data = (paystackJson as Record<string, unknown>).data as Record<string, unknown>;
    const authorizationUrl =
      typeof data.authorization_url === "string" ? data.authorization_url : null;

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
          orderId: order.id,
          reference,
          authorizationUrl,
          totalKobo: order.totalKobo,
        },
      },
      { status: 200 },
    );
  } catch {
    return json({ ok: false, error: "Failed to initialize Paystack" }, { status: 500 });
  }
}
