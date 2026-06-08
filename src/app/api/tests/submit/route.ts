import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getAuthedUser } from "@/server/auth/api";
import { normalizeAnswer } from "@/server/questions/normalize";
import { chatJson } from "@/server/ai/client";

const schema = z.object({
  testId: z.string().min(1),
  module: z.enum(["ellipse", "hyperbola", "parabola", "mixed"]),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        userAnswer: z.string().optional().default(""),
        timeSpent: z.coerce.number().min(0).max(60 * 60).default(0),
      }),
    )
    .min(1)
    .max(20),
});

const analysisSchema = z.object({
  praise: z.string().min(1),
  weakPoints: z.array(z.string()).min(1),
  actions: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  const me = await getAuthedUser();
  if (!me) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });

  const ids = parsed.data.answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: ids } },
    select: { id: true, type: true, content: true, answer: true, knowledgePoints: true },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));

  let correctCount = 0;
  const records: Array<{ questionId: string; isCorrect: boolean; userAnswer: string; timeSpent: number }> = [];

  for (const a of parsed.data.answers) {
    const q = byId.get(a.questionId);
    if (!q) continue;
    const correct = normalizeAnswer(q.type, q.answer || "");
    const given = normalizeAnswer(q.type, a.userAnswer || "");
    const isCorrect = correct.length > 0 ? correct === given : Boolean(given);
    if (isCorrect) correctCount += 1;
    records.push({ questionId: q.id, isCorrect, userAnswer: a.userAnswer || "", timeSpent: a.timeSpent });
  }

  await prisma.$transaction(async (tx) => {
    for (const r of records) {
      await tx.studyRecord.create({
        data: { userId: me.sub, questionId: r.questionId, userAnswer: r.userAnswer, isCorrect: r.isCorrect, timeSpent: r.timeSpent },
      });
      if (!r.isCorrect) {
        await tx.wrongQuestionBook.upsert({
          where: { userId_questionId: { userId: me.sub, questionId: r.questionId } },
          update: { wrongCount: { increment: 1 } },
          create: { userId: me.sub, questionId: r.questionId, wrongCount: 1 },
        });
      }
    }
  });

  const total = records.length || 1;
  const score = Math.round((correctCount / total) * 100);

  const aiAnalysis = await buildAnalysis(parsed.data.module, records, byId);
  await prisma.testReport.create({
    data: { userId: me.sub, module: parsed.data.module, score, aiAnalysis },
  });

  return NextResponse.json({ score, correctCount, total, aiAnalysis });
}

async function buildAnalysis(
  module: "ellipse" | "hyperbola" | "parabola" | "mixed",
  records: Array<{ questionId: string; isCorrect: boolean }>,
  byId: Map<string, { id: string; content: string; knowledgePoints: any }>,
) {
  const wrong = records.filter((r) => !r.isCorrect).map((r) => byId.get(r.questionId)).filter(Boolean) as any[];
  const kp = new Map<string, number>();
  for (const q of wrong) {
    const list: string[] = Array.isArray(q.knowledgePoints) ? q.knowledgePoints : [];
    for (const k of list) kp.set(k, (kp.get(k) || 0) + 1);
  }

  const top = [...kp.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((x) => x[0]);

  const system =
    "你是一名高中数学教研员，擅长基于测验结果做个性化诊断。输出必须为严格 JSON，不要输出多余文本。";

  const user = [
    `测验模块：${module}`,
    `错误题数：${wrong.length}`,
    "",
    "错误题的可能考点标签（按频次）：",
    top.length ? top.join("、") : "（暂无）",
    "",
    "请输出：",
    "- praise：表扬与积极反馈（结合准确率）",
    "- weakPoints：3-6 个薄弱点（中文短语）",
    "- actions：3-6 条行动建议，每条尽量可操作（如“复习某结论并做 3 道针对练习”）",
  ].join("\n");

  const res = await chatJson({ system, user, schema: analysisSchema });
  if (!res.ok) return fallbackAnalysis(module, wrong.length, top);

  const text = ["【表扬】", res.data.praise, "", "【薄弱点】", res.data.weakPoints.map((x) => `- ${x}`).join("\n"), "", "【行动建议】", res.data.actions.map((x) => `- ${x}`).join("\n")].join("\n");
  return text;
}

function fallbackAnalysis(module: string, wrongCount: number, top: string[]) {
  const weak = top.length ? top : ["标准方程与参数意义", "焦点/准线位置", "离心率范围与几何意义"];
  return [
    "【表扬】",
    `本次 ${module} 模块测试已完成。你能坚持做完并提交，非常好。`,
    "",
    "【薄弱点】",
    weak.map((x) => `- ${x}`).join("\n"),
    "",
    "【行动建议】",
    `- 先把错题数（${wrongCount}）对应的知识点在知识库里逐条复习并做笔记`,
    "- 回到模拟器：固定一条曲线，拖动参数观察“变化趋势”与结论对应关系",
    "- 再做 6～10 道同难度练习，确保同类题不重复失分",
  ].join("\n");
}

