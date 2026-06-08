import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getAuthedUser } from "@/server/auth/api";
import { nanoid } from "nanoid";

const schema = z.object({
  module: z.enum(["ellipse", "hyperbola", "parabola", "mixed"]),
});

export async function POST(req: Request) {
  const me = await getAuthedUser();
  if (!me) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });

  const questions = await pickQuestions(parsed.data.module, 12);

  const testId = nanoid(10);
  const deadlineAt = Date.now() + 15 * 60 * 1000;

  return NextResponse.json({ testId, deadlineAt, questions });
}

async function pickQuestions(module: "ellipse" | "hyperbola" | "parabola" | "mixed", count: number) {
  const all = await prisma.question.findMany({
    where: { status: "approved" },
    select: { id: true, type: true, difficulty: true, content: true, answer: true, solution: true, pitfalls: true, knowledgePoints: true },
  });

  const filtered =
    module === "mixed"
      ? all
      : all.filter((q) => {
          const t = q.content;
          if (module === "ellipse") return t.includes("椭圆");
          if (module === "hyperbola") return t.includes("双曲线") || t.includes("渐近线");
          return t.includes("抛物线") || t.includes("y^2");
        });

  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  return filtered.slice(0, count);
}

