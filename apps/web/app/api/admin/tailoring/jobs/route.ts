import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { apiError } from "@/lib/utils/apiResponse";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const jobs = await prisma.tailoringJob.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
        link: true,
        attachments: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const results = jobs.map((job) => ({
      id: job.id,
      status: job.status,
      serviceType: job.serviceType,
      orderId: job.orderId,
      orderNumber: job.order.id.slice(0, 8),
      customerName: job.order.user?.fullName || null,
      customerEmail: job.order.user?.email || null,
      notes: job.notes,
      measurements: job.measurements,
      eventDate: job.eventDate,
      fitPreference: job.fitPreference,
      lockedAt: job.lockedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      order: job.order,
      link: job.link,
      attachments: job.attachments,
    }));

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return apiError(err, "Failed to list tailoring jobs");
  }
}
