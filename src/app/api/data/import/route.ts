import { NextResponse } from "next/server";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { parseImportFile } from "@/lib/excel-parser";
import { checkRateLimit, getClientIp, rateLimitPresets } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  // Rate limit: 5 imports per minute
  const rateLimit = checkRateLimit(getClientIp(request), {
    ...rateLimitPresets.import,
    identifier: "data-import",
  });

  if (!rateLimit.success) {
    return errorResponse("Muitas importações. Tente novamente em breve.", 429, "RATE_LIMITED");
  }

  return withAuth(async () => {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("Nenhum arquivo enviado", 400, "NO_FILE");
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("Arquivo muito grande. Tamanho máximo: 5MB", 400, "FILE_TOO_LARGE");
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx")) {
      return errorResponse("Formato inválido. Envie um arquivo .xlsx", 400, "INVALID_FORMAT");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const preview = await parseImportFile(buffer);

    return NextResponse.json(preview);
  });
}
