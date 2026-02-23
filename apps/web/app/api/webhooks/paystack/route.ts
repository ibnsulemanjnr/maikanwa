// apps/web/app/api/webhooks/paystack/route.ts
import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { OrderPaymentStatus, OrderStatus, PaymentStatus, WebhookProvider } from "@prisma/client";

export const runtime = "nodejs";

function json(data: any, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function makeSignature(secret: string, rawBody: string) {
  return crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
}

/**
 * Paystack webhook shape (high-level):
 * {
 *   event: "charge.success" | ...,
 *   data: { id, reference, amount, currency, status, paid_at, ... }
 * }
 */
type PaystackWebhook = {
  event?: string;
  data?: {
    id?: number | string;
    reference?: string;
    amount?: number; // kobo
    currency?: string;
    status?: string;
    paid_at?: string;
    created_at?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

export async function GET() {
  return json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    // Misconfig: still return 200? Better 500 so you notice in logs.
    return json({ ok: false, error: "PAYSTACK_SECRET_KEY not configured" }, { status: 500 });
  }

  const signature = req.headers.get("x-paystack-signature");
  if (!signature) {
    return json({ ok: false, error: "Missing x-paystack-signature" }, { status: 400 });
  }

  // Must verify against RAW body (not parsed JSON)
  const rawBody = await req.text();
  const expected = makeSignature(secret, rawBody);

  if (!timingSafeEqual(signature, expected)) {
    return json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  let payload: PaystackWebhook;
  try {
    payload = JSON.parse(rawBody) as PaystackWebhook;
  } catch {
    return json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventType = payload.event || "unknown";
  const reference = payload.data?.reference || null;
  const txId = payload.data?.id ?? null;

  // Deterministic idempotency key
  const eventId = `${eventType}:${reference ?? "no_ref"}:${txId ?? "no_id"}`.slice(0, 160);

  // Store event first (idempotency gate)
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: WebhookProvider.PAYSTACK,
        eventId,
        reference: reference ?? undefined,
        eventType,
        payload: payload as any,
      },
    });
  } catch (e: any) {
    // Unique violation means we've already processed this event
    // Prisma code P2002
    if (e?.code === "P2002") {
      return json({ ok: true, received: true, duplicate: true }, { status: 200 });
    }
    // Any other DB error
    return json({ ok: false, error: "Failed to store webhook event" }, { status: 500 });
  }

  // Only process successful charge events for now
  if (eventType !== "charge.success") {
    return json({ ok: true, received: true, ignored: true }, { status: 200 });
  }

  if (!reference) {
    return json(
      { ok: true, received: true, ignored: true, reason: "missing_reference" },
      { status: 200 },
    );
  }

  const paidAmount = payload.data?.amount;
  const currency = payload.data?.currency ?? "NGN";
  const status = payload.data?.status ?? "";

  // Paystack usually sends status: "success"
  if (status && status !== "success") {
    return json(
      { ok: true, received: true, ignored: true, reason: "not_success_status" },
      { status: 200 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.paymentTransaction.findUnique({
        where: { reference },
        select: {
          id: true,
          status: true,
          amountKobo: true,
          currency: true,
          orderId: true,
        },
      });

      // Unknown reference: store-only, do not error (prevents endless retries)
      if (!payment) return;

      // Already paid: idempotent
      if (payment.status === PaymentStatus.PAID) {
        await tx.paymentTransaction.update({
          where: { id: payment.id },
          data: { rawWebhookPayload: payload as any },
        });
        return;
      }

      // Validate amount/currency before marking paid
      if (typeof paidAmount !== "number" || paidAmount <= 0) return;
      if (paidAmount !== payment.amountKobo) return;
      if ((payment.currency || "NGN") !== (currency || "NGN")) return;

      const paidAt = payload.data?.paid_at ? new Date(payload.data.paid_at) : new Date();

      await tx.paymentTransaction.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt,
          rawWebhookPayload: payload as any,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: OrderPaymentStatus.PAID,
          amountPaidKobo: paidAmount,
          paidAt,
          // Move order forward so ops can fulfill it
          status: OrderStatus.PROCESSING,
        },
      });
    });

    return json({ ok: true, received: true, processed: true }, { status: 200 });
  } catch {
    // Return 200 to prevent Paystack retry storms; you'll see the failure in logs
    return json({ ok: true, received: true, processed: false }, { status: 200 });
  }
}
