import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generatePasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import {
  checkRateLimit,
  getClientIp,
  rateLimitPresets,
  rateLimitHeaders,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 attempts per 5 minutes per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp, {
      ...rateLimitPresets.passwordReset,
      identifier: "forgot-password",
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    const successResponse = {
      message: "Se o email existir, você receberá instruções para redefinir sua senha.",
    };

    if (!user) {
      return NextResponse.json(successResponse, {
        headers: rateLimitHeaders(rateLimitResult),
      });
    }

    // Invalidate existing tokens
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const emailHtml = generatePasswordResetEmail(resetUrl, user.name || undefined);
    await sendEmail({
      to: user.email,
      subject: "Recuperação de Senha - FinControl",
      html: emailHtml,
    });

    return NextResponse.json(successResponse, {
      headers: rateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    console.error("Erro ao solicitar recuperação de senha:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
