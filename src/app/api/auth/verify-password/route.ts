import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import {
  checkRateLimit,
  getClientIp,
  rateLimitPresets,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  // Rate limiting - 5 attempts per minute (auth preset)
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp, {
    ...rateLimitPresets.auth,
    identifier: "verify-password",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  return withAuth(async (session, req) => {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return errorResponse("Senha é obrigatória", 400, "VALIDATION_ERROR");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return errorResponse("Usuário não encontrado", 404, "NOT_FOUND");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    return NextResponse.json({ valid: isPasswordValid });
  }, request);
}
