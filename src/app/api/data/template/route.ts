import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { generateImportTemplate } from "@/lib/excel-template";

export async function GET() {
  return withAuth(async () => {
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
  });
}
