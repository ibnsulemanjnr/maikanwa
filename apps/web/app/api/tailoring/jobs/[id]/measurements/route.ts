import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, TailoringStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/requireUser";
import { apiError } from "@/lib/utils/apiResponse";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const SaveMeasurementsSchema = z.object({
  measurements: z.unknown().optional(), // JSON
  notes: z.string().max(800).optional(),
  fitPreference: z.string().max(80).optional(),
  eventDate: z.string().datetime().optional(),

  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        mimeType: z.string().max(80).optional(),
        sizeBytes: z.number().int().nonnegative().optional(),
      }),
    )
    .optional(),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;

    const body = SaveMeasurementsSchema.parse(await req.json());

    const job = await prisma.tailoringJob.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!job || job.order.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "Tailoring job not found" }, { status: 404 });
    }

    // Only editable while in measurement phase
    if (job.lockedAt || job.status !== TailoringStatus.MEASUREMENT_PENDING) {
      return NextResponse.json(
        { ok: false, error: "Measurements are locked for this job" },
        { status: 409 },
      );
    }

    const measurementsValue =
      body.measurements === undefined
        ? undefined
        : body.measurements === null
          ? Prisma.DbNull
          : (body.measurements as Prisma.InputJsonValue);

    const updated = await prisma.$transaction(async (tx) => {
      const jobUpdated = await tx.tailoringJob.update({
        where: { id },
        data: {
          measurements: measurementsValue,
          notes: body.notes ?? undefined,
          fitPreference: body.fitPreference ?? undefined,
          eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
        },
        include: {
          attachments: { orderBy: { createdAt: "asc" } },
          link: true,
        },
      });

      if (body.attachments?.length) {
        await tx.tailoringAttachment.createMany({
          data: body.attachments.map((a) => ({
            tailoringJobId: id,
            url: a.url,
            mimeType: a.mimeType ?? null,
            sizeBytes: a.sizeBytes ?? null,
            uploadedByUserId: user.id,
          })),
        });
      }

      const refreshed = await tx.tailoringJob.findUnique({
        where: { id },
        include: { attachments: { orderBy: { createdAt: "asc" } }, link: true },
      });

      return refreshed ?? jobUpdated;
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    return apiError(err, "Failed to save measurements");
  }
}
