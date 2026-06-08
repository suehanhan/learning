import { prisma } from "@/server/db";
import StudentRadar from "@/components/teacher/student-radar";
import MathMarkdown from "@/components/content/math-markdown";

function classifyModule(content: string) {
  if (content.includes("椭圆")) return "ellipse";
  if (content.includes("双曲线") || content.includes("渐近线")) return "hyperbola";
  if (content.includes("抛物线") || content.includes("y^2")) return "parabola";
  return "mixed";
}

export default async function TeacherStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const student = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, classGroup: true, createdAt: true },
  });
  if (!student) return <div className="text-white/70">学生不存在。</div>;

  const records = await prisma.studyRecord.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, createdAt: true, isCorrect: true, timeSpent: true, userAnswer: true, question: { select: { content: true } } },
  });

  const wrongBook = await prisma.wrongQuestionBook.findMany({
    where: { userId: id },
    orderBy: { wrongCount: "desc" },
    take: 20,
    select: { wrongCount: true, question: { select: { id: true, content: true } } },
  });

  const reports = await prisma.testReport.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, module: true, score: true, aiAnalysis: true, createdAt: true },
  });

  const moduleAgg: Record<string, { total: number; correct: number }> = { ellipse: { total: 0, correct: 0 }, hyperbola: { total: 0, correct: 0 }, parabola: { total: 0, correct: 0 }, mixed: { total: 0, correct: 0 } };
  for (const r of records) {
    const m = classifyModule(r.question.content);
    moduleAgg[m].total += 1;
    if (r.isCorrect) moduleAgg[m].correct += 1;
  }
  const radarData = (Object.keys(moduleAgg) as Array<keyof typeof moduleAgg>).map((k) => ({
    module: ({ ellipse: "椭圆", hyperbola: "双曲线", parabola: "抛物线", mixed: "综合" } as any)[k],
    accuracy: moduleAgg[k].total ? Math.round((moduleAgg[k].correct / moduleAgg[k].total) * 100) : 0,
  }));

  const total = records.length;
  const correct = records.filter((x) => x.isCorrect).length;
  const acc = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs text-white/60">学生档案</div>
            <div className="mt-2 text-2xl font-semibold text-white">{student.name}</div>
            <div className="mt-2 text-sm text-white/70">
              {student.email} · {student.classGroup || "-"} · 加入时间：{student.createdAt.toLocaleString()}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/60">做题数</div>
              <div className="mt-2 text-2xl font-semibold text-white">{total}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/60">正确率</div>
              <div className="mt-2 text-2xl font-semibold text-white">{acc}%</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/60">近 100 题</div>
              <div className="mt-2 text-2xl font-semibold text-white">{correct}/{total || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">模块正确率雷达图</div>
          <div className="mt-4 h-64">
            <StudentRadar data={radarData} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">错题本（TOP20）</div>
          <div className="mt-4 grid gap-3">
            {wrongBook.length ? (
              wrongBook.map((w) => (
                <div key={w.question.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-white/60">错 {w.wrongCount} 次</div>
                    <div className="text-xs text-white/40">题目 ID：{w.question.id.slice(0, 8)}</div>
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <MathMarkdown content={w.question.content} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-white/60">暂无错题记录。</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-semibold text-white">答题记录（近 100 条）</div>
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[820px] text-left text-sm text-white/80">
            <thead className="text-xs text-white/60">
              <tr className="border-b border-white/10">
                <th className="py-2 pr-3">时间</th>
                <th className="py-2 pr-3">对错</th>
                <th className="py-2 pr-3">用时(s)</th>
                <th className="py-2 pr-3">作答</th>
                <th className="py-2 pr-3">题目摘要</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="py-3 pr-3">{r.createdAt.toLocaleString()}</td>
                  <td className="py-3 pr-3">{r.isCorrect ? "✅" : "❌"}</td>
                  <td className="py-3 pr-3">{r.timeSpent}</td>
                  <td className="py-3 pr-3">{r.userAnswer || "-"}</td>
                  <td className="py-3 pr-3">
                    <div className="line-clamp-2 max-w-[520px] text-white/70">{r.question.content}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-semibold text-white">测试报告（近 20 次）</div>
        <div className="mt-4 grid gap-3">
          {reports.length ? (
            reports.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">
                    {{ ellipse: "椭圆", hyperbola: "双曲线", parabola: "抛物线", mixed: "综合" }[r.module]} · {r.score} 分
                  </div>
                  <div className="text-xs text-white/50">{r.createdAt.toLocaleString()}</div>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                  <MathMarkdown content={r.aiAnalysis} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-white/60">暂无测试报告。</div>
          )}
        </div>
      </div>
    </div>
  );
}

