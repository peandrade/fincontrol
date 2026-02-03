import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateCategoryCache } from "@/lib/api-utils";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { createCategorySchema, validateBody } from "@/lib/schemas";
import { checkRateLimit, getClientIp, rateLimitPresets } from "@/lib/rate-limit";

const DEFAULT_ICONS: Record<string, string> = {

  "Aluguel": "Home",
  "Supermercado": "ShoppingCart",
  "Restaurante": "UtensilsCrossed",
  "Delivery": "Bike",
  "Transporte": "Car",
  "Luz": "Lightbulb",
  "Água": "Droplets",
  "Internet": "Wifi",
  "Streaming": "Play",
  "Lazer": "Gamepad2",
  "Saúde": "Heart",
  "Educação": "GraduationCap",
  "Roupas": "Shirt",
  "Pix": "ArrowLeftRight",
  "Fatura Cartão": "CreditCard",
  "Outros": "MoreHorizontal",

  "Salário": "Wallet",
  "Freelance": "Laptop",
  "Investimentos": "TrendingUp",
  "Dividendos": "CircleDollarSign",
};

export async function GET() {
  return withAuth(async (session) => {
    try {
      const customCategories = await prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    });

    const defaultExpenseCategories = EXPENSE_CATEGORIES.map((name) => ({
      id: `default-expense-${name}`,
      name,
      type: "expense" as const,
      icon: DEFAULT_ICONS[name] || "Tag",
      color: CATEGORY_COLORS[name] || "#64748B",
      isDefault: true,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const defaultIncomeCategories = INCOME_CATEGORIES.map((name) => ({
      id: `default-income-${name}`,
      name,
      type: "income" as const,
      icon: DEFAULT_ICONS[name] || "Tag",
      color: CATEGORY_COLORS[name] || "#64748B",
      isDefault: true,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const allCategories = [
      ...defaultExpenseCategories,
      ...defaultIncomeCategories,
      ...customCategories.map((c) => ({ ...c, isDefault: false })),
    ];

      return NextResponse.json(allCategories, {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
        },
      });
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return errorResponse("Erro ao buscar categorias", 500, "CATEGORIES_ERROR");
    }
  });
}

export async function POST(request: Request) {
  // Rate limit: 30 mutations per minute
  const rateLimit = checkRateLimit(getClientIp(request), {
    ...rateLimitPresets.mutation,
    identifier: "categories-create",
  });

  if (!rateLimit.success) {
    return errorResponse("Muitas requisições. Tente novamente em breve.", 429, "RATE_LIMITED");
  }

  return withAuth(async (session, req) => {
    try {
      const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(createCategorySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const { name, type, icon, color } = validation.data;

    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        type,
        userId: session.user.id,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Já existe uma categoria com esse nome" },
        { status: 400 }
      );
    }

    const defaultCategories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if ((defaultCategories as readonly string[]).includes(name)) {
      return NextResponse.json(
        { error: "Não é possível criar uma categoria com o mesmo nome de uma categoria padrão" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        icon,
        color,
        isDefault: false,
        userId: session.user.id,
      },
    });

      // Invalidate related caches
      invalidateCategoryCache(session.user.id);

      return NextResponse.json(category, { status: 201 });
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      return errorResponse("Erro ao criar categoria", 500, "CREATE_CATEGORY_ERROR");
    }
  }, request);
}
