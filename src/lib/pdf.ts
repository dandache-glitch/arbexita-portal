import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

type Section = {
  title: string
  lines: string[]
}

function wrapLine(text: string, maxLen: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? current + ' ' + word : word
    if (test.length > maxLen) {
      if (current) lines.push(current)
      current = word
    } else {
      current = test
    }
  }

  if (current) lines.push(current)
  return lines
}

export async function exportSamPdf(
  filename: string,
  meta: { company: string; orgnr?: string },
  sections: Section[]
) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const marginX = 44

  function drawHeader(page: any) {
    const height = page.getHeight()

    page.drawText('SAM – ARBETSMILJÖDOKUMENTATION', {
      x: marginX,
      y: height - 52,
      size: 14,
      font: bold
    })

    const subtitle = `${meta.company}${
      meta.orgnr ? ' • Org.nr ' + meta.orgnr : ''
    } • ${new Date().toISOString().slice(0, 10)}`

    page.drawText(subtitle, {
      x: marginX,
      y: height - 70,
      size: 10,
      font,
      color: rgb(0.6, 0.6, 0.6)
    })

    page.drawLine({
      start: { x: marginX, y: height - 82 },
      end: { x: page.getWidth() - marginX, y: height - 82 },
      thickness: 1
    })

    return height - 98
  }

  let page = pdfDoc.addPage()
  let y = drawHeader(page)

  function newPage() {
    page = pdfDoc.addPage()
    y = drawHeader(page)
  }

  for (const section of sections) {
    if (y < 90) newPage()

    page.drawText(section.title, {
      x: marginX,
      y,
      size: 12,
      font: bold
    })

    y -= 16

    const lines: string[] = []

    for (const raw of section.lines) {
      wrapLine(raw, 95).forEach((l) => lines.push(l))
    }

    for (const line of lines) {
      if (y < 70) newPage()

      page.drawText(line, {
        x: marginX,
        y,
        size: 10,
        font
      })

      y -= 12
    }

    y -= 10
  }

  if (y < 110) newPage()

  page.drawText('Signatur: ____________________________', {
    x: marginX,
    y: 80,
    size: 10,
    font
  })

  page.drawText('Namn: ____________________   Datum: ____________', {
    x: marginX,
    y: 64,
    size: 10,
    font
  })

  const bytes = await pdfDoc.save()

  // 🔥 FIX: konvertera till ArrayBuffer korrekt
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  )

  const blob = new Blob([buffer], { type: 'application/pdf' })

  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}
