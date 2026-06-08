export default function StudentHomePage() {
  const cards = [
    { href: "/student/knowledge", title: "知识库", desc: "树形目录 + 公式 + 图示 + 例题，支持全局搜索与关联推荐。" },
    { href: "/student/simulator", title: "多曲线模拟器", desc: "同屏对比、参数滑块、关键点标注、导出与分享状态链接。" },
    { href: "/student/practice", title: "分层题库", desc: "基础/中等/困难随机抽题，提交即反馈解析与易错点。" },
    { href: "/student/upload", title: "上传题目 + AI", desc: "图片/文本输入，识别为 LaTeX，返回解析并生成 3 道变式题。" },
    { href: "/student/tests", title: "模块化测试", desc: "按模块限时组卷，交卷后生成个人 AI 诊断报告与进步曲线。" },
  ];

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
        <div className="text-sm text-sky-700">学习建议</div>
        <div className="mt-2 text-xl font-semibold text-slate-900">先看图像，再做题；先做基础，再追技巧。</div>
        <div className="mt-3 text-sm leading-6 text-slate-600">
          建议路径：知识库理解定义与几何意义 → 模拟器做“同屏对比” → 分层题库获取即时反馈 → 上传题目做个性化变式巩固 → 模块测试生成诊断报告。
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="group rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white"
          >
            <div className="text-base font-semibold text-slate-900">{c.title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">{c.desc}</div>
            <div className="mt-4 text-sm font-medium text-sky-700 transition group-hover:text-sky-800">进入 →</div>
          </a>
        ))}
      </div>
    </div>
  );
}

