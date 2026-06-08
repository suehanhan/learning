"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "register";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialMode = (sp.get("mode") as Mode) || "login";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (mode === "login" ? "登录" : "学生注册"), [mode]);

  async function onSubmit(form: HTMLFormElement) {
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData(form);
      const payload =
        mode === "login"
          ? {
              email: String(fd.get("email") || ""),
              password: String(fd.get("password") || ""),
            }
          : {
              name: String(fd.get("name") || ""),
              email: String(fd.get("email") || ""),
              password: String(fd.get("password") || ""),
              classGroup: String(fd.get("classGroup") || "") || undefined,
            };

      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error || "请求失败");

      const role = data?.user?.role;
      if (role === "teacher") router.push("/teacher");
      else router.push("/student");
    } catch (e: any) {
      setError(e?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              教学闭环驱动的圆锥曲线学习平台
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">圆锥曲线专题学习</h1>
            <p className="mt-4 text-sm leading-6 text-white/70 md:text-base">
              学生端支持知识库、同屏对比模拟器、分层练习即时反馈、上传题视觉识别与变式题；教师端提供数据看板、班级共性问题 AI
              分析与周报导出。
            </p>
            <div className="mt-6 grid gap-2 text-sm text-white/70">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                示例学生：student@example.com / student123
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                示例教师：teacher@example.com / teacher123
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_120px_rgba(56,189,248,0.12)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{title}</div>
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
                <button
                  type="button"
                  className={`rounded-lg px-3 py-1.5 transition ${
                    mode === "login" ? "bg-white text-slate-950" : "text-white/70 hover:text-white"
                  }`}
                  onClick={() => setMode("login")}
                >
                  登录
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-3 py-1.5 transition ${
                    mode === "register" ? "bg-white text-slate-950" : "text-white/70 hover:text-white"
                  }`}
                  onClick={() => setMode("register")}
                >
                  注册
                </button>
              </div>
            </div>

            <form
              className="mt-6 grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit(e.currentTarget);
              }}
            >
              {mode === "register" ? (
                <div className="grid gap-2">
                  <label className="text-xs text-white/70">姓名</label>
                  <input
                    name="name"
                    className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-400"
                    placeholder="请输入姓名"
                    required
                  />
                </div>
              ) : null}

              <div className="grid gap-2">
                <label className="text-xs text-white/70">邮箱</label>
                <input
                  name="email"
                  type="email"
                  className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-400"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs text-white/70">密码</label>
                <input
                  name="password"
                  type="password"
                  className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-400"
                  placeholder="至少 6 位"
                  required
                />
              </div>

              {mode === "register" ? (
                <div className="grid gap-2">
                  <label className="text-xs text-white/70">班级（可选）</label>
                  <input
                    name="classGroup"
                    className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-400"
                    placeholder="如：高二(1)班"
                  />
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                disabled={loading}
                className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-sky-500 px-5 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
                type="submit"
              >
                {loading ? "处理中…" : mode === "login" ? "登录" : "注册并进入"}
              </button>

              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/0 px-5 text-sm text-white/80 transition hover:bg-white/5"
                onClick={() => router.push("/")}
              >
                返回首页
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-slate-950" />}>
      <LoginForm />
    </Suspense>
  );
}

