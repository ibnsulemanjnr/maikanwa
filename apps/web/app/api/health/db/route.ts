import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

export async function GET() {
  // Simple DB ping
  const result = await prisma.category.count();
  return NextResponse.json({ ok: true, categoryCount: result });
}
