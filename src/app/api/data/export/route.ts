import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { transactionRepository } from "@/repositories";

export async function GET() {
  return withAuth(async (session) => {
    // Use repository for proper decryption of encrypted fields
    const transactions = await transactionRepository.findByUser(session.user.id);

    // CSV header
    const header = "Tipo,Valor,Categoria,Descrição,Data";

    const rows = transactions.map((t) => {
      const tipo = t.type === "income" ? "Receita" : "Despesa";
      const value = t.value as unknown as number;
      const valor = value.toFixed(2).replace(".", ",");
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
