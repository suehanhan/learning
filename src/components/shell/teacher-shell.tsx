import type { ReactNode } from "react";
import Link from "next/link";
import LogoutButton from "@/components/auth/logout-button";
import CozeChat from "@/components/chat/coze-chat";
import type { SessionClaims } from "@/server/auth/jwt";

const links = [
  { href: "/teacher", label: "仪表盘" },
  { href: "/teacher/students", label: "学生档案" },
  { href: "/teacher/reports", label: "班级报告" },
  { href: "/teacher/insights", label: "困难点分析" },
  { href: "/teacher/resources", label: "资源管理" },
];

export default function TeacherShell({ children, me }: { children: ReactNode; me: SessionClaims }) {
  return (
    <div className="flex min-h-full flex-1 bg-slate-950 text-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-slate-950 md:block">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" className="text-sm font-semibold text-white">
            教师管理端
          </Link>
        </div>
        <nav className="px-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="mt-1 flex items-center justify-between rounded-xl px-3 py-2 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
            >
              <span>{l.label}</span>
              <span className="text-xs text-white/35">→</span>
            </Link>
          ))}
        </nav>
        <div className="mt-6 px-5 text-xs text-white/40">已登录：{me.sub}</div>
        <div className="mt-3 px-5">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-slate-950/70 px-5 backdrop-blur md:hidden">
          <Link href="/" className="text-sm font-semibold text-white">
            教师管理端
          </Link>
          <LogoutButton />
        </header>

        <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-5 py-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <CozeChat />
      </div>
    </div>
  );
}

