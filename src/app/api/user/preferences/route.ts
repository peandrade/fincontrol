import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const defaultGeneral = {
  defaultPage: "dashboard",
  defaultPeriod: "month",
  defaultSort: "recent",
  confirmBeforeDelete: true,
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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        generalSettings: true,
        notificationSettings: true,
        privacySettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      general: { ...defaultGeneral, ...(user.generalSettings as object) },
      notifications: { ...defaultNotifications, ...(user.notificationSettings as object) },
      privacy: { ...defaultPrivacy, ...(user.privacySettings as object) },
    });
  } catch (error) {
    console.error("Erro ao buscar preferências:", error);
    return NextResponse.json({ error: "Erro ao buscar preferências" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { general, notifications, privacy } = body;

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
  } catch (error) {
    console.error("Erro ao atualizar preferências:", error);
    return NextResponse.json({ error: "Erro ao atualizar preferências" }, { status: 500 });
  }
}
