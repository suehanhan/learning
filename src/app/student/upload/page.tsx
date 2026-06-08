"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MathMarkdown from "@/components/content/math-markdown";

export default function UploadPage() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const pollingRef = useRef(false);

  const canSubmit = useMemo(() => text.trim().length > 0 || !!image, [text, image]);

  const pollResult = useCallback(async (questionId: string) => {
    if (pollingRef.current) return;
    pollingRef.current = true;

    let attempts = 0;
    const maxAttempts = 240; // 最多等 4 分钟

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;

      try {
        const res = await fetch(`/api/questions/upload?id=${encodeURIComponent(questionId)}`);
        const data = await res.json();
        if (!res.ok) continue;

        if (data.aiStatus === "done") {
          setResult((prev: any) => ({ ...prev, aiAnalysis: data.aiAnalysis }));
          pollingRef.current = false;
          return;
        }
        if (data.aiStatus === "error") {
          setResult((prev: any) => ({ ...prev, aiError: data.aiError }));
          pollingRef.current = false;
          return;
        }
      } catch {
        // 继续轮询
      }
    }

    pollingRef.current = false;
  }, []);

  // 清理轮询
  useEffect(() => {
    return () => { pollingRef.current = true; };
  }, []);

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      if (text.trim()) fd.set("text", text.trim());
      if (image) fd.set("image", image);

      const res = await fetch("/api/questions/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "提交失败");

      setResult(data);

      // 开始轮询 AI 结果
      if (data.aiStatus === "processing" && data.question?.id) {
        pollResult(data.question.id);
      }
    } catch (e: any) {
      setError(e?.message || "提交失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
        <div className="text-sm text-sky-700">题目上传与 AI 增强</div>
        <div className="mt-2 text-xl font-semibold text-slate-900">把&ldquo;不会的题&rdquo;变成&ldquo;可练的题&rdquo;：解析 + 易错点 + 变式题。</div>
        <div className="mt-3 text-sm leading-6 text-slate-600">
          上传后，AI 智能体会自动分析（约 1-2 分钟）。题目进入待教师审核区，通过后可加入共享题库。
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium text-slate-900">题目文本（可选）</div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="粘贴题目文本，或只上传图片也可以"
                className="min-h-36 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-300"
              />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium text-slate-900">题目图片（可选）</div>
              <div className="flex items-center gap-3">
                <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 transition hover:bg-slate-50">
                  选择图片
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setImage(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {image ? (
                  <div className="flex min-w-0 flex-1 items-center justify-between rounded-xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm text-sky-800">
                    <span className="truncate">{image.name}</span>
                    <button type="button" className="text-sky-900 underline-offset-4 hover:underline" onClick={() => setImage(null)}>
                      移除
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">未选择图片</div>
                )}
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
            ) : null}

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canSubmit || loading}
                onClick={submit}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
              >
                {loading ? "上传中…" : "提交"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setText("");
                  setImage(null);
                  setResult(null);
                  setError(null);
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                清空
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm shadow-sky-100">
          <div className="text-sm font-medium text-slate-900">智能体分析结果</div>
          <div className="mt-3">
            {result ? (
              <div className="grid gap-4">
                <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  已提交，状态：{result.question?.status === "pending" ? "待教师审核" : result.question?.status}
                </div>

                {result.question?.imageUrl ? (
                  <img src={result.question.imageUrl} alt="uploaded" className="w-full rounded-xl border border-slate-200" />
                ) : null}

                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">原题</div>
                  <div className="mt-2">
                    <MathMarkdown content={String(result.question?.content || "")} />
                  </div>
                </div>

                {result.aiAnalysis ? (
                  <div className="rounded-xl border border-sky-100 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-sky-600">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      AI 智能体完整分析
                    </div>
                    <div className="mt-3 text-sm leading-7 text-slate-800">
                      <MathMarkdown content={result.aiAnalysis} />
                    </div>
                  </div>
                ) : result.aiError ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    AI 分析失败：{result.aiError}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                    智能体正在分析题目，请稍候（约 1-2 分钟）…
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm leading-6 text-slate-600">
                提交后，AI 智能体会自动给出完整解答、易错点和同考点变式题。题目默认进入&ldquo;待教师审核&rdquo;列表，教师通过后加入共享题库。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
