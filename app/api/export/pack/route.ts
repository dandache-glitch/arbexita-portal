import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createZip } from "@/lib/zip";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function requireEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    const needs = /[\n\r\t,\"]/g.test(s);
    const out = s.replace(/\"/g, '""');
    return needs ? `"${out}"` : out;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimestampStockholm(d: Date) {
  // Vercel kör i UTC. Vi gör en enkel, stabil timestamp för filnamn.
  // (Exakt lokalzon hanteras i UI; för filnamn räcker denna.)
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const min = pad2(d.getUTCMinutes());
  return `${yyyy}-${mm}-${dd}_${hh}-${min}UTC`;
}

async function buildSummaryPdf(params: {
  companyName: string;
  industry: string;
  exportedAt: string;
  complianceScore: number;
  checklist: { label: string; ok: boolean; note?: string }[];
  risks: any[];
  actions: any[];
  incidents: any[];
}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([595.28, 841.89]); // A4
  const margin = 48;
  let y = 841.89 - margin;

  const drawText = (text: string, opts?: { size?: number; bold?: boolean; color?: any; lineGap?: number }) => {
    const size = opts?.size ?? 11;
    const bold = opts?.bold ?? false;
    const color = opts?.color ?? rgb(0.06, 0.09, 0.16);
    const lineGap = opts?.lineGap ?? 6;
    page.drawText(text, { x: margin, y, size, font: bold ? fontBold : font, color });
    y -= size + lineGap;
  };

  // Header
  drawText("Arbexita – Inspektionspaket", { size: 20, bold: true });
  drawText("SAM-dokumentation sammanställning", { size: 12, color: rgb(0.28, 0.33, 0.42) });
  y -= 8;

  drawText(`Företag: ${params.companyName}`, { bold: true });
  drawText(`Bransch: ${params.industry}`);
  drawText(`Exportdatum: ${params.exportedAt}`);
  drawText(`Compliance-status (indikativ): ${params.complianceScore}%`, { bold: true });
  y -= 10;

  drawText("Checklista – inspektionsredo (indikator)", { bold: true, size: 13 });
  for (const item of params.checklist) {
    const mark = item.ok ? "[OK]" : "[ ]";
    const note = item.note ? ` – ${item.note}` : "";
    drawText(`${mark} ${item.label}${note}`, { size: 11, color: item.ok ? rgb(0.02, 0.46, 0.28) : rgb(0.68, 0.28, 0.03) });
  }

  y -= 8;
  drawText("Sammanfattning", { bold: true, size: 13 });
  drawText(`Riskbedömningar: ${params.risks.length}`);
  drawText(`Åtgärder: ${params.actions.length}`);
  drawText(`Incidenter: ${params.incidents.length}`);

  y -= 10;
  drawText("Ansvarsfriskrivning", { bold: true, size: 12 });
  drawText(
    "Arbexita är ett mjukvaruverktyg som hjälper er att strukturera och dokumentera ert arbetsmiljöarbete. Arbetsgivaren ansvarar alltid för att kraven uppfylls. Detta dokument utgör inte juridisk rådgivning och innebär inga garantier.",
    { size: 10, color: rgb(0.28, 0.33, 0.42), lineGap: 4 }
  );

  return new Uint8Array(await pdf.save());
}

async function buildPolicyPdf(params: {
  companyName: string;
  industry: string;
  created: boolean;
  updatedAt?: string | null;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = 800;

  const draw = (t: string, size = 11, bold = false, color = rgb(0.12, 0.12, 0.12)) => {
    page.drawText(t, { x: margin, y, size, font: bold ? fontBold : font, color });
    y -= size + 8;
  };

  draw("Arbetsmiljöpolicy", 20, true);
  y -= 6;
  draw(`Företag: ${params.companyName}`, 11, true);
  draw(`Bransch: ${params.industry}`);
  draw(`Senast uppdaterad: ${params.updatedAt ? new Date(params.updatedAt).toLocaleDateString("sv-SE") : "—"}`);
  y -= 10;

  if (!params.created) {
    draw("OBS: Policy saknas i portalen", 14, true, rgb(0.68, 0.28, 0.03));
    draw(
      "Denna policyfil är en standardmall. Skapa och spara er policy i Arbexita för att få en verksamhetsanpassad version.",
      11,
      false,
      rgb(0.28, 0.33, 0.42)
    );
    y -= 6;
  }

  draw("Syfte", 14, true);
  draw("Vi ska förebygga ohälsa och olycksfall och skapa en säker och utvecklande arbetsmiljö.");
  y -= 4;

  draw("Arbetssätt (SAM)", 14, true);
  draw("1) Undersöka arbetsmiljön (riskinventering).", 11);
  draw("2) Bedöma risker och prioritera.", 11);
  draw("3) Åtgärda risker (åtgärdsplan med ansvarig + deadline).", 11);
  draw("4) Följa upp åtgärder och utvärdera minst årligen.", 11);
  y -= 4;

  draw("Rutiner", 14, true);
  draw("• Medarbetare rapporterar risker och incidenter omgående.");
  draw("• Chefer säkerställer att åtgärder genomförs och dokumenteras.");
  draw("• Vi uppdaterar policy och rutiner vid förändringar i verksamheten.");
  y -= 10;

  draw("Signatur: ____________________________", 11);

  const bytes = await pdfDoc.save();
  return new Uint8Array(bytes);
}

export async function POST(req: Request) {
  try {
    requireEnv();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const now = new Date();
    const ts = formatTimestampStockholm(now);

    // Company
    const { data: company, error: cErr } = await supabase
      .from("companies")
      .select("id,name,industry,annual_review_done")
      .eq("owner_user_id", userData.user.id)
      .maybeSingle();

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const companyId = (company as any).id as string;
    const companyName = (company as any).name as string;
    const industry = ((company as any).industry as string) || "kontor";
    const annualReviewDone = Boolean((company as any).annual_review_done);

    // Data sets
    const [{ data: risks, error: rErr }, { data: actions, error: aErr }, { data: incidents, error: iErr }] = await Promise.all([
      supabase
        .from("risks")
        .select("title,area,probability,consequence,level,status,notes,created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("actions")
        .select("title,description,status,due_date,source_type,source_id,created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("incidents")
        .select("title,severity,description,created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
    ]);

    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 });
    if (iErr) return NextResponse.json({ error: iErr.message }, { status: 400 });

    // Policy row (metadata) – in current model policies has company_id PK
    const { data: policyRow } = await supabase
      .from("policies")
      .select("company_id,updated_at")
      .eq("company_id", companyId)
      .maybeSingle();
    const policyCreated = Boolean(policyRow);

    const policyPdf = await buildPolicyPdf({
      companyName,
      industry,
      created: policyCreated,
      updatedAt: (policyRow as any)?.updated_at ?? null,
    });

    // Overdue calculation
    const nowIso = new Date().toISOString();
    const overdueActions = (actions ?? []).filter((x: any) => x.status !== "done" && x.due_date && x.due_date < nowIso);
    const noOverdueActions = overdueActions.length === 0;

    const checklist = [
      { label: "Arbetsmiljöpolicy", ok: policyCreated, note: policyCreated ? "Finns" : "Saknas" },
      { label: "Riskbedömning", ok: (risks ?? []).length > 0, note: `${(risks ?? []).length} st` },
      { label: "Åtgärder utan förfall", ok: noOverdueActions, note: `${overdueActions.length} förfallna` },
      { label: "Incidentlogg", ok: (incidents ?? []).length > 0, note: `${(incidents ?? []).length} st` },
      { label: "Årlig uppföljning", ok: annualReviewDone, note: annualReviewDone ? "Markerad" : "Saknas" },
    ];
    const score = Math.round((checklist.filter((x) => x.ok).length / checklist.length) * 100);

    // Summary PDF
    const summaryPdf = await buildSummaryPdf({
      companyName,
      industry,
      exportedAt: `${now.toISOString()}`,
      complianceScore: score,
      checklist,
      risks: risks ?? [],
      actions: actions ?? [],
      incidents: incidents ?? [],
    });

    const riskCsv = toCsv((risks ?? []) as any);
    const actionsCsv = toCsv((actions ?? []) as any);
    const incidentsCsv = toCsv((incidents ?? []) as any);

    const files = [
      { name: `Arbexita_Inspektionspaket_${ts}/00_Arbetsmiljopolicy_${ts}.pdf`, data: policyPdf },
      { name: `Arbexita_Inspektionspaket_${ts}/01_Sammanstallning_${ts}.pdf`, data: summaryPdf },
      { name: `Arbexita_Inspektionspaket_${ts}/02_Riskbedomningar_${ts}.csv`, data: new TextEncoder().encode(riskCsv) },
      { name: `Arbexita_Inspektionspaket_${ts}/03_Atgarder_${ts}.csv`, data: new TextEncoder().encode(actionsCsv) },
      { name: `Arbexita_Inspektionspaket_${ts}/04_Incidenter_${ts}.csv`, data: new TextEncoder().encode(incidentsCsv) },
    ];

    const zipBytes = createZip(files, now);

    return new NextResponse(zipBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=Arbexita_Inspektionspaket_${ts}.zip`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
