import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "圆锥曲线专题学习",
  description: "面向学生与教师的圆锥曲线专题学习平台：数形结合、分层递进、即时反馈与 AI 诊断。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 font-sans">{children}</body>
    </html>
  );
}
