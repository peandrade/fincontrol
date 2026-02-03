import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateCardCache } from "@/lib/api-utils";
import { createCreditCardSchema, validateBody } from "@/lib/schemas";
import { cardRepository } from "@/repositories";

export async function GET() {
  return withAuth(async (session) => {
    // Use repository for proper decryption
    const cards = await cardRepository.findByUser(session.user.id, {
      isActive: true,
      includeInvoices: true,
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

    // Use repository for proper encryption
    const card = await cardRepository.create({
      name,
      lastDigits: lastDigits || undefined,
      limit: limit || 0,
      closingDay,
      dueDay,
      color: color || "#8B5CF6",
      userId: session.user.id,
    });

    // Invalidate related caches
    invalidateCardCache(session.user.id);

    return NextResponse.json({ ...card, invoices: [] }, { status: 201 });
  }, request);
}
