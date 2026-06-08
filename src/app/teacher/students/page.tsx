import { prisma } from "@/server/db";

export default async function TeacherStudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: "student" },
    select: { id: true, name: true, email: true, classGroup: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-semibold text-white">学生列表</div>
        <div className="mt-2 text-sm text-white/60">点击学生进入学习档案：答题记录、模块正确率、错题本与测试报告。</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-white/80">
            <thead className="text-xs text-white/60">
              <tr className="border-b border-white/10">
                <th className="py-2 pr-3">姓名</th>
                <th className="py-2 pr-3">邮箱</th>
                <th className="py-2 pr-3">班级</th>
                <th className="py-2 pr-3">加入时间</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="py-3 pr-3">
                    <a className="text-white hover:underline" href={`/teacher/students/${s.id}`}>
                      {s.name}
                    </a>
                  </td>
                  <td className="py-3 pr-3">{s.email}</td>
                  <td className="py-3 pr-3">{s.classGroup || "-"}</td>
                  <td className="py-3 pr-3">{s.createdAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

