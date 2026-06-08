"use client";

import { useEffect, useState } from "react";
import MathMarkdown from "@/components/content/math-markdown";

type Pending = { id: string; content: string; imageUrl: string | null; createdAt: string };

export default function TeacherResourcesPage() {
  const [items, setItems] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/questions/pending");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "加载失败");
      setItems(data.questions || []);
    } catch (e: any) {
      setError(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, status: "approved" | "rejected") {
    const res = await fetch("/api/teacher/questions/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "操作失败");
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-semibold text-white">资源管理</div>
        <div className="mt-2 text-sm text-white/60">
          学生上传的题目默认进入待审核区。教师通过后加入共享题库；驳回则不进入共享题库（仍可保留学生个人记录）。
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">待审核题目</div>
          <button
            type="button"
            onClick={load}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/80 transition hover:bg-white/10"
          >
            刷新
          </button>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : null}

        <div className="mt-4 grid gap-4">
          {loading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
          ) : items.length ? (
            items.map((q) => (
              <div key={q.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-white/60">提交时间：{new Date(q.createdAt).toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-9 rounded-xl bg-emerald-500 px-4 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
                      onClick={() => act(q.id, "approved")}
                    >
                      通过
                    </button>
                    <button
                      type="button"
                      className="h-9 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 text-sm text-rose-200 transition hover:bg-rose-500/20"
                      onClick={() => act(q.id, "rejected")}
                    >
                      驳回
                    </button>
                  </div>
                </div>

                {q.imageUrl ? <img src={q.imageUrl} alt="uploaded" className="mt-4 w-full rounded-xl border border-white/10" /> : null}

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                  <MathMarkdown content={q.content} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-white/60">暂无待审核题目。</div>
          )}
        </div>
      </div>
    </div>
  );
}

