import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-utils";

export async function GET() {
  return withAuth(async (session) => {
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    });

    // CSV header
    const header = "Tipo,Valor,Categoria,Descrição,Data";

    const rows = transactions.map((t) => {
      const tipo = t.type === "income" ? "Receita" : "Despesa";
      const valor = t.value.toFixed(2).replace(".", ",");
      const categoria = `"${t.category.replace(/"/g, '""')}"`;
      const descricao = `"${(t.description || "").replace(/"/g, '""')}"`;
      const data = new Date(t.date).toLocaleDateString("pt-BR");
      return `${tipo},${valor},${categoria},${descricao},${data}`;
    });

    const csv = "\uFEFF" + [header, ...rows].join("\r\n");

    const today = new Date().toISOString().split("T")[0];
    const filename = `fincontrol-transacoes-${today}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}
