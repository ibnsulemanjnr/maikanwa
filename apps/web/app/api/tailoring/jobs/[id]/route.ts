import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/requireUser";
import { apiError } from "@/lib/utils/apiResponse";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;

    const job = await prisma.tailoringJob.findUnique({
      where: { id },
      include: {
        link: true,
        attachments: { orderBy: { createdAt: "asc" } },
        order: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                title: true,
                productType: true,
                quantity: true,
                unitPriceKobo: true,
                lineTotalKobo: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!job || job.order.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "Tailoring job not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: job });
  } catch (err) {
    return apiError(err, "Failed to fetch tailoring job");
  }
}
