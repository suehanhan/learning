import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getAuthedUser } from "@/server/auth/api";
import { chatJson } from "@/server/ai/client";
import { z } from "zod";

const reportSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  moduleStats: z.array(z.object({ module: z.string(), accuracy: z.number().min(0).max(100) })).min(1),
  topMistakes: z.array(z.string()).min(3),
  teachingSuggestions: z.array(z.string()).min(3),
});

export async function GET() {
  const me = await getAuthedUser();
  if (!me || me.role !== "teacher") return NextResponse.json({ error: "无权限" }, { status: 403 });

  const students = await prisma.user.findMany({ where: { role: "student" }, select: { id: true } });
  const records = await prisma.studyRecord.findMany({
    where: { userId: { in: students.map((s) => s.id) } },
    select: { isCorrect: true, question: { select: { content: true, knowledgePoints: true } } },
    take: 5000,
    orderBy: { createdAt: "desc" },
  });

  const moduleAgg: Record<string, { total: number; correct: number }> = { 椭圆: { total: 0, correct: 0 }, 双曲线: { total: 0, correct: 0 }, 抛物线: { total: 0, correct: 0 }, 综合: { total: 0, correct: 0 } };

  function classify(content: string) {
    if (content.includes("椭圆")) return "椭圆";
    if (content.includes("双曲线") || content.includes("渐近线")) return "双曲线";
    if (content.includes("抛物线") || content.includes("y^2")) return "抛物线";
    return "综合";
  }

  const mistakeKp = new Map<string, number>();
  for (const r of records) {
    const m = classify(r.question.content);
    moduleAgg[m].total += 1;
    if (r.isCorrect) moduleAgg[m].correct += 1;
    if (!r.isCorrect) {
      const raw = r.question.knowledgePoints;
      const list = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
      for (const k of list) mistakeKp.set(k, (mistakeKp.get(k) || 0) + 1);
    }
  }

  const moduleStats = Object.entries(moduleAgg).map(([module, v]) => ({
    module,
    accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0,
  }));

  const topMistakes = [...mistakeKp.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((x) => x[0]);

  const system = "你是高中数学教研员，负责生成班级圆锥曲线周学情报告。回复时先写一段简短的总结文字，然后附上 JSON。";
  const user = [
    "请基于以下统计信息生成班级学情报告。",
    "",
    "模块平均正确率：",
    moduleStats.map((x) => `- ${x.module}：${x.accuracy}%`).join("\n"),
    "",
    "高频易错考点（按频次）：",
    topMistakes.length ? topMistakes.join("、") : "（暂无）",
    "",
    "JSON 字段要求：",
    JSON.stringify({ title: "周报标题", summary: "总体概述", moduleStats: [{ module: "椭圆", accuracy: 75 }], topMistakes: ["考点1"], teachingSuggestions: ["建议1"] }),
  ].join("\n");

  const res = await chatJson({ system, user, schema: reportSchema });

  const report = res.ok
    ? res.data
    : {
        title: "班级圆锥曲线学情周报（离线）",
        summary: "AI 暂不可用（" + res.error + "）。系统给出基于统计的离线周报摘要。",
        moduleStats,
        topMistakes: topMistakes.length ? topMistakes : ["标准方程与参数意义", "焦点/准线位置", "离心率范围与几何意义"],
        teachingSuggestions: [
          "用模拟器做同屏对比：固定一条曲线，拖动参数让学生说出“变化趋势→结论”",
          "针对易错点做 10 分钟微测，讲评时强调公式来源与几何意义",
          "布置分层作业：基础题保正确率，中等题练方法，困难题做策略复盘",
        ],
      };

  const markdown = [
    `# ${report.title}`,
    "",
    "## 总体概述",
    report.summary,
    "",
    "## 模块掌握情况（平均正确率）",
    report.moduleStats.map((x) => `- ${x.module}：${x.accuracy}%`).join("\n"),
    "",
    "## 高频易错考点 TOP10",
    report.topMistakes.map((x, i) => `${i + 1}. ${x}`).join("\n"),
    "",
    "## 教学建议（可执行）",
    report.teachingSuggestions.map((x) => `- ${x}`).join("\n"),
  ].join("\n");

  return NextResponse.json({ reportMarkdown: markdown, moduleStats, topMistakes });
}

