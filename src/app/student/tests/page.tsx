"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MathMarkdown from "@/components/content/math-markdown";

type Module = "ellipse" | "hyperbola" | "parabola" | "mixed";
type QuestionType = "choice" | "blank" | "solution";
type Difficulty = "basic" | "medium" | "hard";

type Question = {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  content: string;
  answer?: string | null;
};

type Report = { id: string; module: Module; score: number; aiAnalysis: string; createdAt: string };

export default function TestsPage() {
  const [module, setModule] = useState<Module>("ellipse");
  const [testId, setTestId] = useState<string | null>(null);
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<any | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  const timer = useMemo(() => {
    if (!deadlineAt) return null;
    const diff = Math.max(0, deadlineAt - Date.now());
    const mm = String(Math.floor(diff / 60000)).padStart(2, "0");
    const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [deadlineAt]);

  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (!deadlineAt) return;
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setDeadlineAt((t) => (t ? t : null));
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [deadlineAt]);

  async function start() {
    setLoading(true);
    setSubmitted(null);
    try {
      const res = await fetch("/api/tests/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ module }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "开始失败");
      setTestId(data.testId);
      setDeadlineAt(data.deadlineAt);
      setQuestions(data.questions || []);
      setAnswers({});
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!testId) return;
    setLoading(true);
    try {
      const payload = {
        testId,
        module,
        answers: questions.map((q) => ({ questionId: q.id, userAnswer: answers[q.id] || "", timeSpent: 0 })),
      };
      const res = await fetch("/api/tests/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "提交失败");
      setSubmitted(data);
      setTestId(null);
      setDeadlineAt(null);
      await loadReports();
    } finally {
      setLoading(false);
    }
  }

  async function loadReports() {
    const res = await fetch("/api/reports");
    const data = await res.json();
    if (res.ok) setReports(data.reports || []);
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-sky-700">模块化测试</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">用一份短测快速定位薄弱点，再用知识库与针对练习补齐。</div>
            <div className="mt-3 text-sm leading-6 text-slate-600">每次测试 10～12 题，默认 15 分钟，交卷后生成 AI 诊断报告与行动建议。</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["ellipse", "hyperbola", "parabola", "mixed"] as Module[]).map((m) => (
              <button
                key={m}
                type="button"
                disabled={loading || !!testId}
                onClick={() => setModule(m)}
                className={`h-10 rounded-xl px-4 text-sm font-medium transition ${
                  module === m ? "bg-sky-600 text-white" : "border border-sky-100 bg-white text-slate-700 hover:bg-sky-50"
                } disabled:opacity-60`}
              >
                {{ ellipse: "椭圆", hyperbola: "双曲线", parabola: "抛物线", mixed: "综合" }[m]}
              </button>
            ))}
            <button
              type="button"
              disabled={loading || !!testId}
              onClick={start}
              className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              开始组卷
            </button>
          </div>
        </div>
      </div>

      {testId ? (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm shadow-sky-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">
                测试中：{{ ellipse: "椭圆", hyperbola: "双曲线", parabola: "抛物线", mixed: "综合" }[module]}
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-1.5 text-sm text-sky-900">剩余时间：{timer || "--:--"}</div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={submit}
                  className="h-10 rounded-xl bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
                >
                  交卷
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-slate-900">第 {idx + 1} 题</div>
                  <div className="rounded-lg border border-sky-100 bg-white px-3 py-1 text-xs text-slate-600">
                    {q.type === "choice" ? "选择" : q.type === "blank" ? "填空" : "解答"} · {{ basic: "基础", medium: "中等", hard: "困难" }[q.difficulty]}
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-slate-100 bg-white p-4">
                  <MathMarkdown content={q.content} />
                </div>
                <div className="mt-4">
                  {q.type === "choice" ? (
                    <div className="flex flex-wrap gap-2">
                      {["A", "B", "C", "D"].map((x) => (
                        <button
                          key={x}
                          type="button"
                          className={`h-10 w-12 rounded-xl border text-sm font-semibold transition ${
                            (answers[q.id] || "").toUpperCase() === x
                              ? "border-sky-300 bg-sky-50 text-sky-700"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                          onClick={() => setAnswers((m) => ({ ...m, [q.id]: x }))}
                        >
                          {x}
                        </button>
                      ))}
                    </div>
                  ) : q.type === "blank" ? (
                    <input
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((m) => ({ ...m, [q.id]: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-sky-300"
                      placeholder="输入答案"
                    />
                  ) : (
                    <textarea
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((m) => ({ ...m, [q.id]: e.target.value }))}
                      className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300"
                      placeholder="写出关键步骤或结论"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : submitted ? (
        <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
          <div className="text-sm text-sky-700">本次报告</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">得分：{submitted.score}（{submitted.correctCount}/{submitted.total}）</div>
          <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
            <MathMarkdown content={String(submitted.aiAnalysis || "")} />
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
        <div className="text-sm font-medium text-slate-900">历史报告</div>
        <div className="mt-3 grid gap-3">
          {reports.length ? (
            reports.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">
                    {{ ellipse: "椭圆", hyperbola: "双曲线", parabola: "抛物线", mixed: "综合" }[r.module]} · {r.score} 分
                  </div>
                  <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{r.aiAnalysis}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-600">暂无历史报告。</div>
          )}
        </div>
      </div>
    </div>
  );
}

