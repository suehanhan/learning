import KnowledgeBrowser from "@/components/knowledge/knowledge-browser";

export default function KnowledgePage() {
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
        <div className="text-sm text-sky-700">知识库</div>
        <div className="mt-2 text-xl font-semibold text-slate-900">用“树形目录”把知识结构搭起来，用“图像”把抽象落到直观。</div>
        <div className="mt-3 text-sm leading-6 text-slate-600">
          提示：先从“定义/标准方程”入手，再用模拟器对比参数变化，最后用分层题库巩固。
        </div>
      </div>

      <KnowledgeBrowser />
    </div>
  );
}

