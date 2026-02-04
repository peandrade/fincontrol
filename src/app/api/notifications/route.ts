import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-utils";

/**
 * GET /api/notifications
 *
 * List notifications for the current user (global + personal).
 */
export async function GET() {
  return withAuth(async (session) => {
    const userId = session.user.id;

    // Get all active notifications (global or for this user)
    const notifications = await prisma.notification.findMany({
      where: {
        isActive: true,
        OR: [
          { userId: null }, // Global notifications
          { userId: userId }, // Personal notifications
        ],
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        ],
      },
      include: {
        readBy: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Transform to include isRead flag
    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      metadata: n.metadata,
      createdAt: n.createdAt.toISOString(),
      isRead: n.readBy.length > 0,
    }));

    const unreadCount = formattedNotifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount,
    });
  });
}
