import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateCardCache } from "@/lib/api-utils";
import { updateCreditCardSchema, validateBody } from "@/lib/schemas";
import { cardRepository } from "@/repositories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    // Use repository for proper decryption (includes ownership check)
    const card = await cardRepository.findById(id, session.user.id, true);

    if (!card) {
      return errorResponse("Cartão não encontrado", 404, "NOT_FOUND");
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

    // Check existence and ownership
    const existing = await cardRepository.findById(id, session.user.id);
    if (!existing) {
      return errorResponse("Cartão não encontrado ou não autorizado", 404, "NOT_FOUND");
    }

    // Use repository for proper encryption
    await cardRepository.update(id, session.user.id, validation.data);

    // Fetch updated card with invoices
    const card = await cardRepository.findById(id, session.user.id, true);

    // Invalidate related caches
    invalidateCardCache(session.user.id);

    return NextResponse.json(card);
  }, request);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    // Check existence and ownership
    const existing = await cardRepository.findById(id, session.user.id);
    if (!existing) {
      return errorResponse("Cartão não encontrado ou não autorizado", 404, "NOT_FOUND");
    }

    // Use repository for delete (no encryption needed, just ownership check)
    await cardRepository.delete(id, session.user.id);

    // Invalidate related caches
    invalidateCardCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}
