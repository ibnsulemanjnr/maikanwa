// apps/web/app/api/payments/paystack/verify/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { OrderPaymentStatus, OrderStatus, PaymentStatus } from "@prisma/client";

export const runtime = "nodejs";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
type ApiRes<T> = ApiOk<T> | ApiErr;

function json<T>(data: ApiRes<T>, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

async function verifyByReference(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return { ok: false as const, status: 500, error: "PAYSTACK_SECRET_KEY not configured" };
  }

  const payment = await prisma.paymentTransaction.findUnique({
    where: { reference },
    select: {
      id: true,
      status: true,
      amountKobo: true,
      currency: true,
      orderId: true,
    },
  });

  if (!payment) {
    return { ok: false as const, status: 404, error: "Payment reference not found" };
  }

  // Idempotent: already paid
  if (payment.status === PaymentStatus.PAID) {
    return {
      ok: true as const,
      status: 200,
      data: {
        reference,
        verified: true,
        alreadyPaid: true,
        orderId: payment.orderId,
      },
    };
  }

  const url = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const body = (await res.json()) as any;

  // Paystack format: { status: true/false, message, data: {...} }
  if (!res.ok || !body || body.status !== true) {
    return { ok: false as const, status: 502, error: "Paystack verification failed" };
  }

  const data = body.data as any;
  const status = data?.status; // "success" or others
  const amount = data?.amount; // kobo
  const currency = data?.currency ?? "NGN";

  const isSuccess = status === "success";
  if (!isSuccess) {
    // Keep it pending; do not mark paid
    await prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: { rawWebhookPayload: body },
    });

    return {
      ok: true as const,
      status: 200,
      data: {
        reference,
        verified: true,
        paid: false,
        paystackStatus: status,
        orderId: payment.orderId,
      },
    };
  }

  // Validate amount/currency
  if (typeof amount !== "number" || amount !== payment.amountKobo) {
    return { ok: false as const, status: 400, error: "Amount mismatch" };
  }
  if ((payment.currency || "NGN") !== (currency || "NGN")) {
    return { ok: false as const, status: 400, error: "Currency mismatch" };
  }

  const paidAt = data?.paid_at ? new Date(data.paid_at) : new Date();

  // Atomic update
  await prisma.$transaction(async (tx) => {
    // Re-check status inside tx for idempotency
    const fresh = await tx.paymentTransaction.findUnique({
      where: { id: payment.id },
      select: { status: true },
    });

    if (fresh?.status === PaymentStatus.PAID) return;

    await tx.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        paidAt,
        rawWebhookPayload: body,
      },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: OrderPaymentStatus.PAID,
        amountPaidKobo: amount,
        paidAt,
        status: OrderStatus.PROCESSING,
      },
    });
  });

  return {
    ok: true as const,
    status: 200,
    data: {
      reference,
      verified: true,
      paid: true,
      orderId: payment.orderId,
    },
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference")?.trim();

  if (!reference) {
    return json({ ok: false, error: "reference is required" }, { status: 400 });
  }

  const result = await verifyByReference(reference);
  if (!result.ok) return json({ ok: false, error: result.error }, { status: result.status });

  return json({ ok: true, data: result.data }, { status: result.status });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as any;
  const reference = typeof body?.reference === "string" ? body.reference.trim() : null;

  if (!reference) {
    return json({ ok: false, error: "reference is required" }, { status: 400 });
  }

  const result = await verifyByReference(reference);
  if (!result.ok) return json({ ok: false, error: result.error }, { status: result.status });

  return json({ ok: true, data: result.data }, { status: result.status });
}
