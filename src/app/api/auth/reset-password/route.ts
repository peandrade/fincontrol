import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  checkRateLimit,
  getClientIp,
  rateLimitPresets,
  rateLimitHeaders,
} from "@/lib/rate-limit";

// Password validation: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 attempts per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp, {
      ...rateLimitPresets.auth,
      identifier: "reset-password",
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde um minuto e tente novamente." },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Enhanced password validation
    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error:
            "A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número",
        },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "Este link já foi utilizado. Solicite um novo." },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Este link expirou. Solicite um novo." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased from 10 to 12 rounds

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json(
      { message: "Senha alterada com sucesso!" },
      { headers: rateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for token validation
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp, {
      limit: 10,
      windowSeconds: 60,
      identifier: "validate-reset-token",
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { valid: false, error: "Muitas tentativas" },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token não fornecido" },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { valid: false, error: "Token inválido" },
        { status: 400 }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { valid: false, error: "Token já utilizado" },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, error: "Token expirado" },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    return NextResponse.json(
      { valid: false, error: "Erro ao verificar token" },
      { status: 500 }
    );
  }
}
