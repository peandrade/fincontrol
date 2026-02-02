import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateCardCache } from "@/lib/api-utils";
import { createCreditCardSchema, validateBody } from "@/lib/schemas";

export async function GET() {
  return withAuth(async (session) => {
    const cards = await prisma.creditCard.findMany({
      where: { isActive: true, userId: session.user.id },
      include: {
        invoices: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
          include: {
            purchases: {
              orderBy: { date: "desc" },
              take: 100,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cards);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (session, req) => {
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(createCreditCardSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400, "VALIDATION_ERROR", validation.details);
    }

    const { name, lastDigits, limit, closingDay, dueDay, color } = validation.data;

    const card = await prisma.creditCard.create({
      data: {
        name,
        lastDigits: lastDigits || null,
        limit: limit || 0,
        closingDay,
        dueDay,
        color: color || "#8B5CF6",
        userId: session.user.id,
      },
      include: {
        invoices: true,
      },
    });

    // Invalidate related caches
    invalidateCardCache(session.user.id);

    return NextResponse.json(card, { status: 201 });
  }, request);
}
