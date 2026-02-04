import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { feedbackStatusSchema, validateBody } from "@/lib/schemas";
import {
  withAuth,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/api-utils";
import { isAdmin } from "@/lib/admin";
import { z } from "zod";

const updateFeedbackSchema = z.object({
  status: feedbackStatusSchema.optional(),
  adminResponse: z.string().max(2000).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/feedback/[id]
 *
 * Get a single feedback by ID (admin only).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    if (!isAdmin(session.user.id)) {
      return forbiddenResponse();
    }

    const { id } = await params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!feedback) {
      return notFoundResponse("Feedback");
    }

    return NextResponse.json(feedback);
  });
}

/**
 * PATCH /api/feedback/[id]
 *
 * Update feedback status and/or add admin response (admin only).
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    if (!isAdmin(session.user.id)) {
      return forbiddenResponse();
    }

    const { id } = await params;
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(updateFeedbackSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400, "VALIDATION_ERROR", validation.details);
    }

    const { status, adminResponse } = validation.data;

    if (!status && !adminResponse) {
      return errorResponse("Informe status ou adminResponse", 400, "VALIDATION_ERROR");
    }

    // Check if feedback exists
    const existing = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse("Feedback");
    }

    const statusLabels: Record<string, string> = {
      pending: "Pendente",
      reviewing: "Em análise",
      resolved: "Resolvido",
      closed: "Fechado",
    };

    // Build update data
    const updateData: Record<string, unknown> = {};
    const notificationsToCreate: Array<{
      title: string;
      message: string;
      type: "feedback_status" | "feedback_response";
      userId: string;
      metadata: { feedbackId: string };
    }> = [];

    if (status && status !== existing.status) {
      updateData.status = status;

      // Create notification for status change
      notificationsToCreate.push({
        title: "Status do feedback atualizado",
        message: `Seu feedback foi marcado como "${statusLabels[status] || status}".`,
        type: "feedback_status",
        userId: existing.userId,
        metadata: { feedbackId: id },
      });
    }

    if (adminResponse && adminResponse !== existing.adminResponse) {
      updateData.adminResponse = adminResponse;
      updateData.respondedAt = new Date();

      // Create notification for admin response
      notificationsToCreate.push({
        title: "Resposta ao seu feedback",
        message: adminResponse.length > 100
          ? adminResponse.substring(0, 100) + "..."
          : adminResponse,
        type: "feedback_response",
        userId: existing.userId,
        metadata: { feedbackId: id },
      });
    }

    // Update feedback and create notifications in a transaction
    const [feedback] = await prisma.$transaction([
      prisma.feedback.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      ...notificationsToCreate.map((n) =>
        prisma.notification.create({ data: n })
      ),
    ]);

    return NextResponse.json(feedback);
  }, request);
}

/**
 * DELETE /api/feedback/[id]
 *
 * Delete a feedback (admin only).
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    if (!isAdmin(session.user.id)) {
      return forbiddenResponse();
    }

    const { id } = await params;

    // Check if feedback exists
    const existing = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse("Feedback");
    }

    await prisma.feedback.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  });
}
