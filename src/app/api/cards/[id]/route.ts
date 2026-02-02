import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateCardCache } from "@/lib/api-utils";
import { updateCreditCardSchema, validateBody } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const card = await prisma.creditCard.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12, // Limit invoices to prevent N+1
          include: {
            purchases: {
              orderBy: { date: "desc" },
              take: 50, // Limit purchases per invoice
            },
          },
        },
      },
    });

    if (!card) {
      return errorResponse("Cartão não encontrado", 404, "NOT_FOUND");
    }

    if (card.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    return NextResponse.json(card);
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id } = await params;
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(updateCreditCardSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const existing = await prisma.creditCard.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Cartão não encontrado", 404, "NOT_FOUND");
    }

    if (existing.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    const card = await prisma.creditCard.update({
      where: { id },
      data: validation.data,
      include: {
        invoices: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
        },
      },
    });

    // Invalidate related caches
    invalidateCardCache(session.user.id);

    return NextResponse.json(card);
  }, request);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const existing = await prisma.creditCard.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Cartão não encontrado", 404, "NOT_FOUND");
    }

    if (existing.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    await prisma.creditCard.delete({
      where: { id },
    });

    // Invalidate related caches
    invalidateCardCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}
