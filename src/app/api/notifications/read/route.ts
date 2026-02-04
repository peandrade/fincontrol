import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const markReadSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

/**
 * POST /api/notifications/read
 *
 * Mark notification(s) as read.
 */
export async function POST(request: Request) {
  return withAuth(async (session, req) => {
    const userId = session.user.id;
    const body = await req.json();
    const validation = markReadSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Dados inválidos", 400, "VALIDATION_ERROR");
    }

    const { notificationIds, all } = validation.data;

    if (all) {
      // Mark all unread notifications as read
      const unreadNotifications = await prisma.notification.findMany({
        where: {
          isActive: true,
          OR: [
            { userId: null },
            { userId: userId },
          ],
          NOT: {
            readBy: {
              some: { userId },
            },
          },
        },
        select: { id: true },
      });

      if (unreadNotifications.length > 0) {
        await prisma.notificationRead.createMany({
          data: unreadNotifications.map((n) => ({
            userId,
            notificationId: n.id,
          })),
          skipDuplicates: true,
        });
      }
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await prisma.notificationRead.createMany({
        data: notificationIds.map((notificationId) => ({
          userId,
          notificationId,
        })),
        skipDuplicates: true,
      });
    } else {
      return errorResponse("Informe notificationIds ou all: true", 400, "VALIDATION_ERROR");
    }

    return NextResponse.json({ success: true });
  }, request);
}
