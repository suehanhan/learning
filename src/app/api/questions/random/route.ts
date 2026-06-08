import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";

const schema = z.object({
  difficulty: z.enum(["basic", "medium", "hard"]).optional(),
  count: z.coerce.number().min(1).max(20).default(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = schema.safeParse({
    difficulty: url.searchParams.get("difficulty") || undefined,
    count: url.searchParams.get("count") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });

  const rows = await prisma.question.findMany({
    where: { status: "approved", ...(parsed.data.difficulty ? { difficulty: parsed.data.difficulty } : {}) },
    select: {
      id: true,
      type: true,
      difficulty: true,
      content: true,
      answer: true,
      solution: true,
      pitfalls: true,
      knowledgePoints: true,
    },
  });

  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  return NextResponse.json({ questions: rows.slice(0, parsed.data.count) });
}

