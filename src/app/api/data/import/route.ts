import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseImportFile } from "@/lib/excel-parser";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 5MB" },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx")) {
      return NextResponse.json(
        { error: "Formato inválido. Envie um arquivo .xlsx" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const preview = await parseImportFile(buffer);

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Erro ao processar arquivo:", error);
    return NextResponse.json(
      { error: "Erro ao processar arquivo. Verifique se o formato está correto." },
      { status: 500 }
    );
  }
}
