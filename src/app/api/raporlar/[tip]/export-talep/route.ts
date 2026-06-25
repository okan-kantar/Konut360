import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";
import { getRaporVerileri } from "@/lib/services/raporlar";
import { generateRaporPDF } from "@/lib/pdf/generateRaporPDF";
import { generateRaporExcel } from "@/lib/excel/generateRaporExcel";

const GECERLI_TIPLER = new Set([
  "gelir-gider",
  "borc-dokumu",
  "kasa-detay",
  "tahsilat",
  "firma-odemeleri",
  "yillik",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tip: string }> },
) {
  try {
    const session = await requirePermission("rapor:view");
    const { tip } = await params;
    const format = request.nextUrl.searchParams.get("format") ?? "excel";

    if (!GECERLI_TIPLER.has(tip)) throw new HttpError(400, "gecersiz_rapor_tipi");
    if (format !== "pdf" && format !== "excel") throw new HttpError(400, "gecersiz_format");

    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "rapor.export_talep",
      entityType: "Rapor",
      after: { tip, format },
    });

    if (format === "pdf") {
      const veri = await getRaporVerileri(session.siteId as string);
      const pdfBuffer = await generateRaporPDF(tip, veri);

      const dosyaAdi = `konut360-${tip}-${veri.donem}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(dosyaAdi)}`,
          "Content-Length": String(pdfBuffer.length),
        },
      });
    }

    const veri = await getRaporVerileri(session.siteId as string);
    const excelBuffer = await generateRaporExcel(tip, veri);

    const dosyaAdi = `konut360-${tip}-${veri.donem}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(dosyaAdi)}`,
        "Content-Length": String(excelBuffer.length),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
