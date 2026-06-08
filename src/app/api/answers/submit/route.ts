import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getAuthedUser } from "@/server/auth/api";
import { normalizeAnswer } from "@/server/questions/normalize";
import { chatJson } from "@/server/ai/client";

const schema = z.object({
  questionId: z.string().min(1),
  userAnswer: z.string().optional().default(""),
  timeSpent: z.coerce.number().min(0).max(60 * 60).default(0),
});

const variantSchema = z.object({
  variants: z
    .array(
      z.object({
        difficulty: z.enum(["basic", "medium", "hard"]),
        content: z.string().min(1),
        answer: z.string().optional().default(""),
        solution: z.string().optional().default(""),
        pitfalls: z.string().optional().default(""),
      }),
    )
    .min(1)
    .max(3),
});

export async function POST(req: Request) {
  const me = await getAuthedUser();
  if (!me) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });

  const q = await prisma.question.findUnique({
    where: { id: parsed.data.questionId },
    select: { id: true, type: true, content: true, answer: true, solution: true, pitfalls: true, knowledgePoints: true },
  });
  if (!q) return NextResponse.json({ error: "题目不存在" }, { status: 404 });

  const correct = normalizeAnswer(q.type, q.answer || "");
  const given = normalizeAnswer(q.type, parsed.data.userAnswer || "");
  const isCorrect = correct.length > 0 ? correct === given : Boolean(given);

  await prisma.studyRecord.create({
    data: {
      userId: me.sub,
      questionId: q.id,
      userAnswer: parsed.data.userAnswer || "",
      isCorrect,
      timeSpent: parsed.data.timeSpent,
    },
  });

  if (!isCorrect) {
    await prisma.wrongQuestionBook.upsert({
      where: { userId_questionId: { userId: me.sub, questionId: q.id } },
      update: { wrongCount: { increment: 1 } },
      create: { userId: me.sub, questionId: q.id, wrongCount: 1 },
    });
  }

  const variants = await generateVariants(q.content);

  const savedVariants = variants.length
    ? await prisma.$transaction(
        variants.map((v) =>
          prisma.generatedQuestion.create({
            data: {
              parentQuestionId: q.id,
              difficultyLevel: v.difficulty,
              content: v.content,
              answer: v.answer,
              solution: v.solution,
            },
          }),
        ),
      )
    : [];

  return NextResponse.json({
    isCorrect,
    answer: q.answer,
    solution: q.solution,
    pitfalls: q.pitfalls,
    knowledgePoints: q.knowledgePoints,
    variants: savedVariants,
  });
}

async function generateVariants(content: string) {
  const system =
    "你是一名高中数学教研员，擅长把一道圆锥曲线题生成同考点的变式题，并给出简洁但可执行的解析与易错点提示。输出必须为严格 JSON，不要输出多余文本。";

  const user = [
    "请基于下面题目，生成 3 道“同考点但难度递进”的变式题：",
    "要求：",
    "1) 每道题都要给出 answer（最终答案）与 solution（关键步骤）",
    "2) difficulty 只能取 basic / medium / hard",
    "3) content 使用 Markdown，公式用 KaTeX/LaTeX 形式（如 $x^2$ 或 $$...$$）",
    "4) 每道题附带 pitfalls（常见误区）",
    "",
    "原题：",
    content,
  ].join("\n");

  const res = await chatJson({ system, user, schema: variantSchema });
  if (!res.ok) {
    console.warn("AI 生成变式题失败:", res.error);
    return fallbackVariants(content);
  }
  return res.data.variants;
}

function fallbackVariants(content: string) {
  const base = content.split("\n")[0] || "【变式】请完成相关计算。";
  return [
    {
      difficulty: "basic" as const,
      content: `${base}\n\n（变式 1）请直接套用定义/标准方程计算关键量。`,
      answer: "",
      solution: "提示：先写出标准方程对应的参数含义，再代入计算。",
      pitfalls: "常见误区：公式记忆混淆（椭圆与双曲线的 $c^2$）。",
    },
    {
      difficulty: "medium" as const,
      content: `${base}\n\n（变式 2）在参数变化下讨论范围或分类。`,
      answer: "",
      solution: "提示：设参数后用不等式/判别式讨论。",
      pitfalls: "常见误区：漏讨论边界或忽略参数取值条件。",
    },
    {
      difficulty: "hard" as const,
      content: `${base}\n\n（变式 3）与直线/弦/切线结合，提取几何意义。`,
      answer: "",
      solution: "提示：联立方程后用点差法或切线模板化简。",
      pitfalls: "常见误区：计算过程冗长导致失误，建议先做代数结构化整理。",
    },
  ];
}
