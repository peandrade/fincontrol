import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    return NextResponse.json(
      { error: "Erro ao exportar dados" },
      { status: 500 }
    );
  }
}
