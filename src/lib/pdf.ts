import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
type Section = { title: string, lines: string[] }

function wrapLine(text: string, maxLen: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = (cur ? cur + ' ' : '') + w
    if (next.length > maxLen) { if (cur) lines.push(cur); cur = w } else cur = next
  }
  if (cur) lines.push(cur)
  return lines
}

export async function exportSamPdf(filename: string, meta: { company: string, orgnr?: string }, sections: Section[]) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const marginX = 44

  const drawHeader = (page: any) => {
    const h = page.getHeight()
    page.drawText('SAM – ARBETSMILJÖDOKUMENTATION', { x: marginX, y: h - 52, size: 14, font: bold })
    const sub = `${meta.company}${meta.orgnr ? ' • Org.nr ' + meta.orgnr : ''} • ${new Date().toISOString().slice(0,10)}`
    page.drawText(sub, { x: marginX, y: h - 70, size: 10, font, color: rgb(0.70,0.74,0.82) })
    page.drawLine({ start: { x: marginX, y: h - 82 }, end: { x: page.getWidth()-marginX, y: h - 82 }, thickness: 1, color: rgb(0.15,0.18,0.26) })
    return h - 98
  }

  let page = pdfDoc.addPage()
  let y = drawHeader(page)
  const newPage = () => { page = pdfDoc.addPage(); y = drawHeader(page) }

  for (const s of sections) {
    if (y < 90) newPage()
    page.drawText(s.title, { x: marginX, y, size: 12, font: bold })
    y -= 16
    const allLines: string[] = []
    for (const raw of s.lines) wrapLine(raw, 95).forEach(l => allLines.push(l))
    for (const line of allLines) {
      if (y < 70) newPage()
      page.drawText(line, { x: marginX, y, size: 10, font })
      y -= 12
    }
    y -= 10
  }

  if (y < 110) newPage()
  page.drawText('Signatur (valfritt): ____________________________', { x: marginX, y: 80, size: 10, font })
  page.drawText('Namn: ____________________   Datum: ____________', { x: marginX, y: 64, size: 10, font })

  const bytes = await pdfDoc.save()
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
