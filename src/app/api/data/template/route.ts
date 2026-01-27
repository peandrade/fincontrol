import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateImportTemplate } from "@/lib/excel-template";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const buffer = await generateImportTemplate();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="fincontrol-modelo-importacao.xlsx"',
      },
    });
  } catch (error) {
    console.error("Erro ao gerar template:", error);
    return NextResponse.json(
      { error: "Erro ao gerar template" },
      { status: 500 }
    );
  }
}
