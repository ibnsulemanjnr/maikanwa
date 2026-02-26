// apps/
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, TailoringServiceType, ProductType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/requireUser";
import { apiError } from "@/lib/utils/apiResponse";

export const runtime = "nodejs";

const CreateTailoringJobSchema = z.object({
  orderId: z.string().uuid(),
  serviceOrderItemId: z.string().uuid(),
  fabricOrderItemId: z.string().uuid().optional(),
  serviceType: z.nativeEnum(TailoringServiceType),

  notes: z.string().max(800).optional(),
  fitPreference: z.string().max(80).optional(),
  eventDate: z.string().datetime().optional(), // ISO datetime
  measurements: z.unknown().optional(), // JSON object
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const jobs = await prisma.tailoringJob.findMany({
      where: {
        order: { userId: user.id },
      },
      include: {
        link: true,
        attachments: { orderBy: { createdAt: "asc" } },
        order: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ ok: true, data: jobs });
  } catch (err) {
    return apiError(err, "Failed to list tailoring jobs");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = CreateTailoringJobSchema.parse(await req.json());

    // Verify order belongs to user + has the required order items
    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      include: {
        items: true,
      },
    });

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const serviceItem = order.items.find((i) => i.id === body.serviceOrderItemId);
    if (!serviceItem) {
      return NextResponse.json({ ok: false, error: "Invalid order item" }, { status: 400 });
    }

    const fabricItem = body.fabricOrderItemId
      ? order.items.find((i) => i.id === body.fabricOrderItemId)
      : null;

    if (body.serviceType === TailoringServiceType.SEW_FROM_FABRIC) {
      if (!fabricItem || fabricItem.productType !== ProductType.FABRIC) {
        return NextResponse.json(
          { ok: false, error: "SEW_FROM_FABRIC requires a FABRIC order item" },
          { status: 400 },
        );
      }
    }

    const measurementsValue =
      body.measurements === undefined
        ? undefined
        : body.measurements === null
          ? Prisma.DbNull
          : (body.measurements as Prisma.InputJsonValue);

    // Create job + link in one transaction
    const created = await prisma.$transaction(async (tx) => {
      // prevent duplicates for the same service item (TailoringLink has @@unique(serviceOrderItemId))
      const existing = await tx.tailoringLink.findUnique({
        where: { serviceOrderItemId: body.serviceOrderItemId },
        select: { tailoringJobId: true },
      });
      if (existing) {
        return { alreadyExists: true as const, tailoringJobId: existing.tailoringJobId };
      }

      const job = await tx.tailoringJob.create({
        data: {
          orderId: body.orderId,
          serviceType: body.serviceType,
          notes: body.notes ?? null,
          fitPreference: body.fitPreference ?? null,
          eventDate: body.eventDate ? new Date(body.eventDate) : null,
          measurements: measurementsValue,
        },
        select: { id: true },
      });

      await tx.tailoringLink.create({
        data: {
          tailoringJobId: job.id,
          serviceOrderItemId: body.serviceOrderItemId,
          fabricOrderItemId: body.fabricOrderItemId ?? null,
        },
      });

      return { alreadyExists: false as const, tailoringJobId: job.id };
    });

    if (created.alreadyExists) {
      return NextResponse.json(
        {
          ok: true,
          data: { id: created.tailoringJobId },
          message: "Tailoring job already exists for this service item",
        },
        { status: 200 },
      );
    }

    const job = await prisma.tailoringJob.findUnique({
      where: { id: created.tailoringJobId },
      include: { link: true, attachments: true },
    });

    return NextResponse.json({ ok: true, data: job }, { status: 201 });
  } catch (err) {
    return apiError(err, "Failed to create tailoring job");
  }
}
