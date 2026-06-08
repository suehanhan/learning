export default function Home() {
  return (
    <div className="flex-1 bg-gradient-to-b from-sky-50 via-white to-sky-50">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/60 px-3 py-1 text-xs text-sky-700 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              数形结合 · 分层递进 · 即时反馈 · AI 诊断
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              圆锥曲线专题学习
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">
              面向学生端与教师管理端的一体化学习平台：同屏多曲线对比、参数滑块变形、分层题库即时反馈、上传题目视觉识别与变式生成、模块化测试与 AI
              查漏补缺、教师数据看板与班级共性问题分析。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-medium text-white shadow-sm shadow-sky-200 transition hover:bg-sky-700"
              >
                进入登录
              </a>
              <a
                href="/student"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-sky-200 bg-white px-5 text-sm font-medium text-slate-900 transition hover:bg-sky-50"
              >
                直接体验学生端
              </a>
            </div>
            <div className="mt-5 text-sm text-slate-600">
              <div>示例账号：</div>
              <div className="mt-1 grid gap-1 sm:grid-cols-2">
                <div className="rounded-lg border border-sky-100 bg-white/70 px-3 py-2">
                  学生：student@example.com / student123
                </div>
                <div className="rounded-lg border border-sky-100 bg-white/70 px-3 py-2">
                  教师：teacher@example.com / teacher123
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl rounded-2xl border border-sky-100 bg-white/70 p-6 shadow-sm shadow-sky-100 backdrop-blur">
            <div className="text-sm font-medium text-slate-900">学习闭环示意</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-sky-100 bg-white px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">知识点 → 图像对比</div>
                <div className="mt-1 text-sm text-slate-600">公式可视化，参数可调，立刻看见“方程在图像上意味着什么”。</div>
              </div>
              <div className="rounded-xl border border-sky-100 bg-white px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">练习 → 即时反馈</div>
                <div className="mt-1 text-sm text-slate-600">提交即给答案、思路、易错点与考点，并自动生成变式巩固。</div>
              </div>
              <div className="rounded-xl border border-sky-100 bg-white px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">测试 → AI 诊断</div>
                <div className="mt-1 text-sm text-slate-600">定位薄弱模块与高频失分点，给出可执行的复习链接与针对练习。</div>
              </div>
              <div className="rounded-xl border border-sky-100 bg-white px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">教师 → 数据看板</div>
                <div className="mt-1 text-sm text-slate-600">全班整体掌握、易错点 TOP10、上传题困难点聚类，支持导出周报。</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-sky-100 bg-white/70 p-6 shadow-sm shadow-sky-100">
            <div className="text-sm font-semibold text-slate-900">多曲线同屏对比</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              选中某条曲线调参，其它保持不变；关键点（焦点/顶点/准线/渐近线）随显隐同步。
            </div>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-white/70 p-6 shadow-sm shadow-sky-100">
            <div className="text-sm font-semibold text-slate-900">无障碍提问</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              右下角答疑支持文字/图片，提供“引导思考”模式，引用知识库条目，形成可追溯对话。
            </div>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-white/70 p-6 shadow-sm shadow-sky-100">
            <div className="text-sm font-semibold text-slate-900">可分享链接</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              支持一键生成临时公网链接，给不在同一局域网的同学直接访问你的本地部署版本。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
