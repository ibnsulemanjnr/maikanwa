import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TailoringStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { apiError } from "@/lib/utils/apiResponse";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const PatchStatusSchema = z.object({
  status: z.nativeEnum(TailoringStatus),
  note: z.string().max(800).optional(),
});

const ALLOWED_NEXT: Record<TailoringStatus, TailoringStatus[]> = {
  MEASUREMENT_PENDING: ["CUTTING", "CANCELLED"],
  CUTTING: ["SEWING", "CANCELLED"],
  SEWING: ["QA", "CANCELLED"],
  QA: ["READY", "CANCELLED"],
  READY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const body = PatchStatusSchema.parse(await req.json());

    const job = await prisma.tailoringJob.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ ok: false, error: "Tailoring job not found" }, { status: 404 });
    }

    if (job.status === body.status) {
      return NextResponse.json({ ok: true, data: job });
    }

    const allowed = ALLOWED_NEXT[job.status] || [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { ok: false, error: `Invalid status transition: ${job.status} → ${body.status}` },
        { status: 400 },
      );
    }

    const updated = await prisma.tailoringJob.update({
      where: { id },
      data: {
        status: body.status,
        // Lock edits when moving past measurement pending
        lockedAt:
          job.status === "MEASUREMENT_PENDING" && body.status !== "MEASUREMENT_PENDING"
            ? new Date()
            : job.lockedAt,
        // Optional: append note into notes field (simple approach)
        notes: body.note ? `${job.notes ? job.notes + "\n" : ""}${body.note}` : job.notes,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    return apiError(err, "Failed to update tailoring status");
  }
}
