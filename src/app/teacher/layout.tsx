import type { ReactNode } from "react";
import { requireUser } from "@/server/auth/require-user";
import TeacherShell from "@/components/shell/teacher-shell";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const me = await requireUser("teacher");
  return <TeacherShell me={me}>{children}</TeacherShell>;
}

