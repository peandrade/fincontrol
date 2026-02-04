import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { isAdmin } from "@/lib/admin";
import { z } from "zod";

const updateNotificationSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  message: z.string().min(1).max(1000).optional(),
  type: z.enum(["feature", "fix", "alert", "info"]).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/notifications/[id]
 *
 * Get a specific notification (admin only).
 */
export async function GET(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    if (!isAdmin(session.user.id)) {
      return errorResponse("Acesso negado", 403, "FORBIDDEN");
    }

    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        _count: {
          select: { readBy: true },
        },
      },
    });

    if (!notification) {
      return errorResponse("Notificação não encontrada", 404, "NOT_FOUND");
    }

    return NextResponse.json({
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isActive: notification.isActive,
        expiresAt: notification.expiresAt?.toISOString() || null,
        createdAt: notification.createdAt.toISOString(),
        readCount: notification._count.readBy,
      },
    });
  });
}

/**
 * PUT /api/notifications/[id]
 *
 * Update a notification (admin only).
 */
export async function PUT(request: Request, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    if (!isAdmin(session.user.id)) {
      return errorResponse("Acesso negado", 403, "FORBIDDEN");
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateNotificationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        validation.error.issues[0]?.message || "Dados inválidos",
        400,
        "VALIDATION_ERROR"
      );
    }

    const existing = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Notificação não encontrada", 404, "NOT_FOUND");
    }

    const { title, message, type, isActive, expiresAt } = validation.data;

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(message !== undefined && { message }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt !== undefined && {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }),
      },
    });

    return NextResponse.json({ notification });
  }, request);
}

/**
 * DELETE /api/notifications/[id]
 *
 * Delete a notification (admin only).
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    if (!isAdmin(session.user.id)) {
      return errorResponse("Acesso negado", 403, "FORBIDDEN");
    }

    const { id } = await params;

    const existing = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Notificação não encontrada", 404, "NOT_FOUND");
    }

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  });
}
