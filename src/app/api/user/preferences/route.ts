import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { updatePreferencesSchema, validateBody } from "@/lib/schemas";

const defaultGeneral = {
  defaultPage: "dashboard",
  defaultPeriod: "month",
  defaultSort: "recent",
  confirmBeforeDelete: true,
  displayCurrency: "BRL",
  language: "pt",
};

const defaultNotifications = {
  budgetAlerts: true,
  budgetThreshold: 80,
  billReminders: true,
  reminderDays: 3,
  weeklyReport: false,
  monthlyReport: true,
  sounds: true,
  vibration: true,
};

const defaultPrivacy = {
  hideValues: false,
  autoLock: false,
  autoLockTime: 5,
};

export async function GET() {
  return withAuth(async (session) => {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        generalSettings: true,
        notificationSettings: true,
        privacySettings: true,
      },
    });

    if (!user) {
      return errorResponse("Usuário não encontrado", 404, "NOT_FOUND");
    }

    return NextResponse.json({
      general: { ...defaultGeneral, ...(user.generalSettings as object) },
      notifications: { ...defaultNotifications, ...(user.notificationSettings as object) },
      privacy: { ...defaultPrivacy, ...(user.privacySettings as object) },
    });
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(async (session, req) => {
    const body = await req.json();

    const validation = validateBody(updatePreferencesSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const { general, notifications, privacy } = validation.data;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(general !== undefined && { generalSettings: general }),
        ...(notifications !== undefined && { notificationSettings: notifications }),
        ...(privacy !== undefined && { privacySettings: privacy }),
      },
      select: {
        generalSettings: true,
        notificationSettings: true,
        privacySettings: true,
      },
    });

    return NextResponse.json({
      general: { ...defaultGeneral, ...(user.generalSettings as object) },
      notifications: { ...defaultNotifications, ...(user.notificationSettings as object) },
      privacy: { ...defaultPrivacy, ...(user.privacySettings as object) },
    });
  }, request);
}
