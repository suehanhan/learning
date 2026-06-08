import type { ReactNode } from "react";
import Link from "next/link";
import LogoutButton from "@/components/auth/logout-button";
import CozeChat from "@/components/chat/coze-chat";
import type { SessionClaims } from "@/server/auth/jwt";

const links = [
  { href: "/student", label: "学习首页" },
  { href: "/student/knowledge", label: "知识库" },
  { href: "/student/simulator", label: "模拟器" },
  { href: "/student/practice", label: "分层题库" },
  { href: "/student/upload", label: "上传题目" },
  { href: "/student/tests", label: "模块测试" },
];

export default function StudentShell({ children, me }: { children: ReactNode; me: SessionClaims }) {
  return (
    <div className="flex-1 bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <header className="sticky top-0 z-20 border-b border-sky-100 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-slate-900">
              圆锥曲线专题学习
            </Link>
            <nav className="hidden items-center gap-2 md:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-sky-50 hover:text-slate-900"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-lg border border-sky-100 bg-white px-3 py-1.5 text-xs text-slate-700 md:block">
              已登录：{me.sub}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      <CozeChat />
    </div>
  );
}

