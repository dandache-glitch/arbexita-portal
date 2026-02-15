import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const companyName = String(body.companyName ?? "Företaget");
  const industry = String(body.industry ?? "Bransch");

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = 800;

  function draw(t: string, size = 11, bold = false) {
    page.drawText(t, { x: margin, y, size, font: bold ? fontBold : font, color: rgb(0.12, 0.12, 0.12) });
    y -= size + 8;
  }

  draw("Arbetsmiljöpolicy", 20, true);
  y -= 6;
  draw(`Företag: ${companyName}`, 11, true);
  draw(`Bransch: ${industry}`);
  draw(`Datum: ${new Date().toLocaleDateString("sv-SE")}`);
  y -= 10;

  draw("Syfte", 14, true);
  draw("Vi ska förebygga ohälsa och olycksfall och skapa en säker och utvecklande arbetsmiljö.");
  y -= 4;

  draw("Arbetssätt (SAM)", 14, true);
  draw("1) Undersöka arbetsmiljön (riskinventering).");
  draw("2) Bedöma risker och prioritera (Sannolikhet × Konsekvens).");
  draw("3) Åtgärda risker (åtgärdsplan med ansvarig + deadline).");
  draw("4) Följa upp åtgärder och utvärdera minst årligen.");
  y -= 4;

  draw("Rutiner", 14, true);
  draw("• Medarbetare rapporterar risker och incidenter omgående.");
  draw("• Chefer säkerställer att åtgärder genomförs och dokumenteras.");
  draw("• Vi uppdaterar policy och rutiner vid förändringar i verksamheten.");
  y -= 10;

  draw("Signatur: ____________________________", 11);

  const bytes = await pdfDoc.save();
  // create a safe ArrayBuffer
  const safeBytes = new Uint8Array(bytes);
  const arrayBuffer = safeBytes.buffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="arbetsmiljopolicy-${companyName.replace(/\s+/g, "_")}.pdf"`
    }
  });
}
