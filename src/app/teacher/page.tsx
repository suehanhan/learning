import { prisma } from "@/server/db";
import TeacherOverviewCharts from "@/components/teacher/teacher-overview-charts";

function classifyModule(content: string) {
  if (content.includes("椭圆")) return "ellipse";
  if (content.includes("双曲线") || content.includes("渐近线")) return "hyperbola";
  if (content.includes("抛物线") || content.includes("y^2")) return "parabola";
  return "mixed";
}

export default async function TeacherHomePage() {
  const students = await prisma.user.findMany({
    where: { role: "student" },
    select: { id: true, name: true, email: true, classGroup: true },
    orderBy: { createdAt: "asc" },
  });

  const records = await prisma.studyRecord.findMany({
    where: { userId: { in: students.map((s) => s.id) } },
    select: { userId: true, isCorrect: true, createdAt: true, question: { select: { content: true } } },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const byUser = new Map<string, { total: number; correct: number; lastAt: Date | null; module: Record<string, { total: number; correct: number }> }>();
  for (const s of students) byUser.set(s.id, { total: 0, correct: 0, lastAt: null, module: {} });

  for (const r of records) {
    const u = byUser.get(r.userId);
    if (!u) continue;
    u.total += 1;
    if (r.isCorrect) u.correct += 1;
    if (!u.lastAt || r.createdAt > u.lastAt) u.lastAt = r.createdAt;
    const m = classifyModule(r.question.content);
    const slot = (u.module[m] ||= { total: 0, correct: 0 });
    slot.total += 1;
    if (r.isCorrect) slot.correct += 1;
  }

  const studentRows = students.map((s) => {
    const stat = byUser.get(s.id)!;
    const acc = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0;
    const last = stat.lastAt ? stat.lastAt.toLocaleString() : "暂无";
    const weak = Object.entries(stat.module)
      .map(([k, v]) => ({ k, acc: v.total ? v.correct / v.total : 0, total: v.total }))
      .filter((x) => x.total >= 3)
      .sort((a, b) => a.acc - b.acc)[0]?.k;

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      classGroup: s.classGroup || "-",
      total: stat.total,
      acc,
      last,
      weak: weak ? ({ ellipse: "椭圆", hyperbola: "双曲线", parabola: "抛物线", mixed: "综合" } as any)[weak] : "-",
    };
  });

  const classTotal = studentRows.reduce((a, b) => a + b.total, 0);
  const classCorrect = records.reduce((a, b) => a + (b.isCorrect ? 1 : 0), 0);
  const classAcc = classTotal ? Math.round((classCorrect / classTotal) * 100) : 0;

  const moduleAgg: Record<string, { total: number; correct: number }> = { ellipse: { total: 0, correct: 0 }, hyperbola: { total: 0, correct: 0 }, parabola: { total: 0, correct: 0 }, mixed: { total: 0, correct: 0 } };
  for (const r of records) {
    const m = classifyModule(r.question.content);
    moduleAgg[m].total += 1;
    if (r.isCorrect) moduleAgg[m].correct += 1;
  }

  const chartData = (Object.keys(moduleAgg) as Array<keyof typeof moduleAgg>).map((k) => ({
    module: ({ ellipse: "椭圆", hyperbola: "双曲线", parabola: "抛物线", mixed: "综合" } as any)[k],
    accuracy: moduleAgg[k].total ? Math.round((moduleAgg[k].correct / moduleAgg[k].total) * 100) : 0,
  }));

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-white/60">学生人数</div>
          <div className="mt-2 text-3xl font-semibold text-white">{students.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-white/60">做题总量</div>
          <div className="mt-2 text-3xl font-semibold text-white">{classTotal}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-white/60">整体正确率</div>
          <div className="mt-2 text-3xl font-semibold text-white">{classAcc}%</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-semibold text-white">模块平均正确率</div>
        <div className="mt-4 h-64">
          <TeacherOverviewCharts data={chartData} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">学生数据总览</div>
          <a href="/teacher/students" className="text-sm text-sky-300 hover:text-sky-200">
            查看详情 →
          </a>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-white/80">
            <thead className="text-xs text-white/60">
              <tr className="border-b border-white/10">
                <th className="py-2 pr-3">姓名</th>
                <th className="py-2 pr-3">邮箱</th>
                <th className="py-2 pr-3">班级</th>
                <th className="py-2 pr-3">做题数</th>
                <th className="py-2 pr-3">正确率</th>
                <th className="py-2 pr-3">最近学习</th>
                <th className="py-2 pr-3">薄弱模块</th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="py-3 pr-3">
                    <a className="text-white hover:underline" href={`/teacher/students/${s.id}`}>
                      {s.name}
                    </a>
                  </td>
                  <td className="py-3 pr-3">{s.email}</td>
                  <td className="py-3 pr-3">{s.classGroup}</td>
                  <td className="py-3 pr-3">{s.total}</td>
                  <td className="py-3 pr-3">{s.acc}%</td>
                  <td className="py-3 pr-3">{s.last}</td>
                  <td className="py-3 pr-3">{s.weak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

