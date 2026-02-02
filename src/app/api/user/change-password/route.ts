import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import {
  checkRateLimit,
  getClientIp,
  rateLimitPresets,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import { isValidPassword } from "@/lib/password-utils";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  // Rate limiting - 5 attempts per minute (auth preset)
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp, {
    ...rateLimitPresets.auth,
    identifier: "change-password",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  return withAuth(async (session, req) => {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse(
        "Senha atual e nova senha são obrigatórias",
        400,
        "VALIDATION_ERROR"
      );
    }

    if (!isValidPassword(newPassword)) {
      return errorResponse(
        "A nova senha deve ter no mínimo 8 caracteres, uma maiúscula, uma minúscula e um número",
        400,
        "VALIDATION_ERROR"
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return errorResponse("Usuário não encontrado", 404, "NOT_FOUND");
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse("Senha atual incorreta", 400, "INVALID_PASSWORD");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Senha alterada com sucesso" });
  }, request);
}
