import { jsPDF } from "jspdf";

const MARGIN = 54;
const PAGE_HEIGHT = 792;
const PAGE_WIDTH = 612;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_SIZE = 10.5;
const TEXT_COLOR = "#111111";

interface Cursor {
  y: number;
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/<label>([^<]*)<\/label>/g, " ($1)")
    .replace(/\\\|/g, "|")
    .trim();
}

function ensureSpace(pdf: jsPDF, cursor: Cursor, needed: number) {
  if (cursor.y + needed > PAGE_HEIGHT - MARGIN) {
    pdf.addPage();
    cursor.y = MARGIN;
  }
}

function writeHeading(pdf: jsPDF, cursor: Cursor, text: string, level: 1 | 2 | 3) {
  const size = level === 1 ? 16 : level === 2 ? 12.5 : 11.5;
  const lineHeight = size * 1.3;
  pdf.setFont("times", "bold");
  pdf.setFontSize(size);
  pdf.setTextColor(TEXT_COLOR);
  cursor.y += level === 1 ? 4 : 12;
  ensureSpace(pdf, cursor, lineHeight);
  pdf.text(stripInlineMarkdown(text), MARGIN, cursor.y);
  cursor.y += lineHeight * 0.7;
}

function writeCaption(pdf: jsPDF, cursor: Cursor, text: string) {
  const size = 9;
  const lineHeight = size * 1.3;
  pdf.setFont("times", "italic");
  pdf.setFontSize(size);
  pdf.setTextColor("#555555");
  ensureSpace(pdf, cursor, lineHeight);
  pdf.text(text, MARGIN, cursor.y);
  cursor.y += lineHeight + 4;
}

function writeParagraph(pdf: jsPDF, cursor: Cursor, text: string) {
  const lineHeight = BODY_SIZE * 1.4;
  pdf.setFont("times", "normal");
  pdf.setFontSize(BODY_SIZE);
  pdf.setTextColor(TEXT_COLOR);
  const lines = pdf.splitTextToSize(stripInlineMarkdown(text), USABLE_WIDTH);

  // Avoid splitting short paragraphs across a page break (widow/orphan lines).
  const remaining = PAGE_HEIGHT - MARGIN - cursor.y;
  if (lines.length <= 3 && lines.length * lineHeight > remaining) {
    pdf.addPage();
    cursor.y = MARGIN;
  }

  for (const line of lines) {
    ensureSpace(pdf, cursor, lineHeight);
    pdf.text(line, MARGIN, cursor.y);
    cursor.y += lineHeight;
  }
  cursor.y += 8;
}

function writeChecklistItem(pdf: jsPDF, cursor: Cursor, checked: boolean, text: string) {
  const lineHeight = BODY_SIZE * 1.4;
  const boxSize = 8;
  const textIndent = 16;
  pdf.setFont("times", "normal");
  pdf.setFontSize(BODY_SIZE);
  pdf.setTextColor(TEXT_COLOR);
  const lines = pdf.splitTextToSize(stripInlineMarkdown(text), USABLE_WIDTH - textIndent);

  ensureSpace(pdf, cursor, lineHeight);
  pdf.setDrawColor(90);
  pdf.rect(MARGIN, cursor.y - boxSize, boxSize, boxSize);
  if (checked) {
    pdf.setLineWidth(1);
    pdf.line(MARGIN + 1, cursor.y - boxSize / 2, MARGIN + boxSize / 2.5, cursor.y - 1.5);
    pdf.line(MARGIN + boxSize / 2.5, cursor.y - 1.5, MARGIN + boxSize - 1, cursor.y - boxSize + 1);
    pdf.setLineWidth(0.2);
  }

  lines.forEach((line: string, i: number) => {
    if (i > 0) ensureSpace(pdf, cursor, lineHeight);
    pdf.text(line, MARGIN + textIndent, cursor.y);
    cursor.y += lineHeight;
  });
  cursor.y += 4;
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  // Split on "|" delimiters only, not on the "\|" escape mergeTemplate.ts uses
  // to let user-entered text contain a literal pipe inside a table cell.
  return trimmed.split(/(?<!\\)\|/).map((cell) => stripInlineMarkdown(cell.trim()));
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.every((cell) => cell === "" || /^:?-+:?$/.test(cell));
}

function writeTable(pdf: jsPDF, cursor: Cursor, rows: string[][]) {
  const colWidths = [USABLE_WIDTH * 0.4, USABLE_WIDTH * 0.3, USABLE_WIDTH * 0.3];
  const colX = [MARGIN, MARGIN + colWidths[0], MARGIN + colWidths[0] + colWidths[1]];
  const size = 9.5;
  const lineHeight = size * 1.3;
  pdf.setFontSize(size);

  cursor.y += 8;

  rows.forEach((row, rowIndex) => {
    const wrapped = row.map((cell, i) =>
      cell ? pdf.splitTextToSize(cell, colWidths[i] - 8) : []
    );
    const rowLines = Math.max(...wrapped.map((w) => w.length), 1);
    const rowHeight = rowLines * lineHeight + 6;

    ensureSpace(pdf, cursor, rowHeight);
    const startY = cursor.y;
    row.forEach((_, i) => {
      pdf.setFont("times", i === 0 || rowIndex === 0 ? "bold" : "normal");
      wrapped[i].forEach((line: string, li: number) => {
        pdf.text(line, colX[i], startY + li * lineHeight);
      });
    });
    cursor.y = startY + rowLines * lineHeight + 6;
    pdf.setDrawColor(210);
    pdf.line(MARGIN, cursor.y - 3, MARGIN + USABLE_WIDTH, cursor.y - 3);
  });

  cursor.y += 6;
}

function renderMarkdownBlock(pdf: jsPDF, cursor: Cursor, markdown: string) {
  const lines = markdown.split("\n");
  let tableBuffer: string[] = [];

  function flushTable() {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer.map(parseTableRow).filter((cells) => !isSeparatorRow(cells));
    writeTable(pdf, cursor, rows);
    tableBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("|")) {
      tableBuffer.push(line);
      continue;
    }
    flushTable();

    if (line === "") continue;

    if (line.startsWith("### ")) {
      writeHeading(pdf, cursor, line.slice(4), 3);
    } else if (line.startsWith("## ")) {
      writeHeading(pdf, cursor, line.slice(3), 2);
    } else if (line.startsWith("# ")) {
      writeHeading(pdf, cursor, line.slice(2), 1);
    } else if (/^<label>.*<\/label>$/.test(line)) {
      writeCaption(pdf, cursor, line.replace(/<\/?label>/g, ""));
    } else if (line.startsWith("- [x]") || line.startsWith("- [ ]")) {
      const checked = line.startsWith("- [x]");
      const text = line.replace(/^- \[[x ]\]\s*/, "");
      writeChecklistItem(pdf, cursor, checked, text);
    } else {
      writeParagraph(pdf, cursor, line);
    }
  }

  flushTable();
}

export function generateNdaPdf(coverPageMarkdown: string, standardTermsMarkdown: string): jsPDF {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const cursor: Cursor = { y: MARGIN };

  renderMarkdownBlock(pdf, cursor, coverPageMarkdown);
  pdf.addPage();
  cursor.y = MARGIN;
  renderMarkdownBlock(pdf, cursor, standardTermsMarkdown);

  return pdf;
}
