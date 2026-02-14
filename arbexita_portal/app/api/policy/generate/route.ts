import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const companyName = String(body.companyName ?? "Företaget");
  const industry = String(body.industry ?? "Bransch");
  const employees = Number(body.employees ?? 1);
  const responsible = String(body.responsible ?? "Arbetsgivaren");

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = 800;

  function text(t: string, size = 11, bold = false) {
    page.drawText(t, {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= size + 8;
  }

  text("Arbetsmiljöpolicy", 20, true);
  y -= 6;
  text(`Företag: ${companyName}`, 11, true);
  text(`Bransch: ${industry}`);
  text(`Antal anställda: ${employees}`);
  text(`Ansvarig: ${responsible}`);
  y -= 8;

  text("Syfte", 14, true);
  text("Vår arbetsmiljö ska vara säker, inkluderande och förebygga ohälsa och olyckor.");
  y -= 4;

  text("Mål", 14, true);
  text("• Förebygga risker genom regelbundna riskbedömningar och åtgärdsplaner.");
  text("• Rapportera och följa upp tillbud/olyckor samt vidta förebyggande åtgärder.");
  text("• Säkerställa att ansvar, rutiner och uppföljning är dokumenterade och kända.");
  y -= 4;

  text("Arbetssätt (SAM)", 14, true);
  text("1) Undersöka arbetsmiljön (riskinventering).");
  text("2) Bedöma risker (sannolikhet × konsekvens) och prioritera.");
  text("3) Åtgärda risker (åtgärdsplan med ansvarig + deadline).");
  text("4) Kontrollera/uppföljning (minst årligen och vid förändringar).");
  y -= 4;

  text("Roller & ansvar", 14, true);
  text("• Arbetsgivaren ansvarar för att SAM bedrivs och att resurser finns.");
  text("• Chefer/arbetsledare ansvarar för att rutiner följs i vardagen.");
  text("• Medarbetare rapporterar risker och incidenter och följer instruktioner.");
  y -= 10;

  text(`Datum: ${new Date().toLocaleDateString("sv-SE")}`, 11);g
  text("Signatur: ____________________________", 11);

  // pdf-lib -> Uint8Array<ArrayBufferLike> (kan trigga SharedArrayBuffer i TS-typer)
  const bytes = await pdfDoc.save();

  // ✅ Skapa en "säker" kopia med riktig ArrayBuffer
  const safeBytes = new Uint8Array(bytes);

  // ✅ Returnera ArrayBuffer som BodyInit (TS-kompatibelt)
  const arrayBuffer = safeBytes.buffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="arbetsmiljopolicy-${companyName.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
