import { NextResponse } from "next/server";
import { getAuthedUser } from "@/server/auth/api";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET() {
  const me = await getAuthedUser();
  if (!me || me.role !== "teacher") return NextResponse.json({ error: "无权限" }, { status: 403 });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const res = await fetch(new URL("/api/teacher/class-report", baseUrl));
  const data = await res.json();
  const text = String(data.reportMarkdown || "");

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const lines = wrapText(text.replace(/\r/g, ""), 90);
  let y = 800;
  for (const line of lines) {
    if (y < 60) {
      y = 800;
      pdf.addPage([595.28, 841.89]);
    }
    page.drawText(line, { x: 40, y, size: 10, font, color: rgb(0.12, 0.12, 0.12) });
    y -= 14;
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="class-report.pdf"`,
    },
  });
}

function wrapText(text: string, maxLen: number) {
  const out: string[] = [];
  for (const rawLine of text.split("\n")) {
    let line = rawLine;
    while (line.length > maxLen) {
      out.push(line.slice(0, maxLen));
      line = line.slice(maxLen);
    }
    out.push(line);
  }
  return out;
}

