import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { updateProfileSchema, validateBody } from "@/lib/schemas";

export async function GET() {
  return withAuth(async (session) => {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse("Usuário não encontrado", 404, "NOT_FOUND");
    }

    return NextResponse.json(user);
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(async (session, req) => {
    const body = await req.json();

    const validation = validateBody(updateProfileSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const { name, image } = validation.data;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  }, request);
}
