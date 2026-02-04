import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { isAdmin } from "@/lib/admin";
import { z } from "zod";

const createNotificationSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(100),
  message: z.string().min(1, "Mensagem é obrigatória").max(1000),
  type: z.enum(["feature", "fix", "alert", "info"]),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/notifications/admin
 *
 * List all notifications (admin only).
 */
export async function GET() {
  return withAuth(async (session) => {
    if (!isAdmin(session.user.id)) {
      return errorResponse("Acesso negado", 403, "FORBIDDEN");
    }

    const notifications = await prisma.notification.findMany({
      where: {
        // Only show platform notifications (not personal feedback ones)
        type: { in: ["feature", "fix", "alert", "info"] },
      },
      include: {
        _count: {
          select: { readBy: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get total users count for read percentage
    const totalUsers = await prisma.user.count();

    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isActive: n.isActive,
      expiresAt: n.expiresAt?.toISOString() || null,
      createdAt: n.createdAt.toISOString(),
      readCount: n._count.readBy,
      readPercent: totalUsers > 0 ? Math.round((n._count.readBy / totalUsers) * 100) : 0,
    }));

    return NextResponse.json({ notifications: formattedNotifications });
  });
}

/**
 * POST /api/notifications/admin
 *
 * Create a new platform notification (admin only).
 */
export async function POST(request: Request) {
  return withAuth(async (session, req) => {
    if (!isAdmin(session.user.id)) {
      return errorResponse("Acesso negado", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const validation = createNotificationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        validation.error.issues[0]?.message || "Dados inválidos",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { title, message, type, expiresAt } = validation.data;

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: null, // Global notification
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  }, request);
}
