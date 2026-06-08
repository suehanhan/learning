"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MathMarkdown from "@/components/content/math-markdown";

type Difficulty = "basic" | "medium" | "hard";
type QuestionType = "choice" | "blank" | "solution";

type Question = {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  content: string;
  answer?: string | null;
  solution?: string | null;
  pitfalls?: string | null;
  knowledgePoints?: any;
};

type Variant = { id: string; difficultyLevel: Difficulty; content: string; answer?: string | null; solution?: string | null };

export default function PracticePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("basic");
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<null | {
    isCorrect: boolean;
    answer?: string | null;
    solution?: string | null;
    pitfalls?: string | null;
    variants: Variant[];
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number>(Date.now());

  const difficultyLabel = useMemo(
    () => ({ basic: "基础", medium: "中等", hard: "困难" }[difficulty]),
    [difficulty],
  );

  async function loadOne(d: Difficulty) {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswer("");
    try {
      const res = await fetch(`/api/questions/random?difficulty=${d}&count=1`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "加载失败");
      const questionItem = (data?.questions || [])[0] as Question | undefined;
      if (!questionItem) throw new Error("题库为空");
      setQuestion(questionItem);
      startedAt.current = Date.now();
    } catch (e: any) {
      setError(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOne(difficulty);
  }, []);

  async function submit() {
    if (!question) return;
    setLoading(true);
    setError(null);

    try {
      const timeSpent = Math.max(0, Math.floor((Date.now() - startedAt.current) / 1000));
      const res = await fetch("/api/answers/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: question.id, userAnswer: answer, timeSpent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "提交失败");
      setResult({ isCorrect: data.isCorrect, answer: data.answer, solution: data.solution, pitfalls: data.pitfalls, variants: data.variants || [] });
    } catch (e: any) {
      setError(e?.message || "提交失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-sky-700">分层题库练习</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">选择难度随机抽题，提交后即时反馈并生成变式题。</div>
            <div className="mt-3 text-sm leading-6 text-slate-600">
              当前难度：{difficultyLabel}。建议：先保证基础正确率，再逐步提升到中等与困难。
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["basic", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDifficulty(d);
                  loadOne(d);
                }}
                className={`h-10 rounded-xl px-4 text-sm font-medium transition ${
                  difficulty === d ? "bg-sky-600 text-white" : "border border-sky-100 bg-white text-slate-700 hover:bg-sky-50"
                }`}
              >
                {{ basic: "基础", medium: "中等", hard: "困难" }[d]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => loadOne(difficulty)}
              className="h-10 rounded-xl border border-sky-100 bg-white px-4 text-sm text-slate-700 transition hover:bg-sky-50"
            >
              换一题
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
          {loading && !question ? (
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ) : question ? (
            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-900">题目</div>
                <div className="rounded-lg border border-sky-100 bg-white px-3 py-1 text-xs text-slate-600">
                  {difficultyLabel} · {question.type === "choice" ? "选择题" : question.type === "blank" ? "填空题" : "解答题"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <MathMarkdown content={question.content} />
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium text-slate-900">作答</div>
                {question.type === "choice" ? (
                  <div className="flex flex-wrap gap-2">
                    {["A", "B", "C", "D"].map((x) => (
                      <button
                        type="button"
                        key={x}
                        className={`h-10 w-12 rounded-xl border text-sm font-semibold transition ${
                          answer.toUpperCase() === x ? "border-sky-300 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                        onClick={() => setAnswer(x)}
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                ) : question.type === "blank" ? (
                  <input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-300"
                    placeholder="输入你的答案（如：e=0.8 或 F(1,0)）"
                  />
                ) : (
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="min-h-28 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-300"
                    placeholder="写出关键步骤或最终结论"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={loading}
                  type="button"
                  onClick={submit}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
                >
                  {loading ? "提交中…" : "提交并获取反馈"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setAnswer("");
                    setResult(null);
                    startedAt.current = Date.now();
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  重写
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">暂无题目。</div>
          )}
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
          <div className="text-sm font-medium text-slate-900">即时反馈</div>
          <div className="mt-3">
            {result ? (
              <div className="grid gap-4">
                <div className={`rounded-xl border px-4 py-3 text-sm ${result.isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
                  {result.isCorrect ? "做对了！继续保持。建议再做 1～2 道同难度巩固。" : "暂时不对。别急，先对照解析定位是哪一步卡住。"}
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">参考答案</div>
                  <div className="mt-2 text-sm text-slate-900">{result.answer || "（本题为开放式/略）"}</div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">解析要点</div>
                  <div className="mt-2">
                    <MathMarkdown content={result.solution || "暂无解析"} />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">易错点提醒</div>
                  <div className="mt-2 text-sm leading-6 text-slate-700">{result.pitfalls || "暂无"} </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">变式题（同考点递进）</div>
                  <div className="mt-3 grid gap-3">
                    {result.variants?.length ? (
                      result.variants.map((v) => (
                        <div key={v.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-medium text-slate-600">难度：{{ basic: "基础", medium: "中等", hard: "困难" }[v.difficultyLevel]}</div>
                          </div>
                          <div className="mt-2 rounded-lg border border-slate-100 bg-white p-3">
                            <MathMarkdown content={v.content} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-600">暂无变式题。</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-6 text-slate-600">
                提交后将返回：答案、关键步骤、易错点、考点提示，并生成变式题用于巩固。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
