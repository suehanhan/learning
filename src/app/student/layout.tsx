import type { ReactNode } from "react";
import { requireUser } from "@/server/auth/require-user";
import StudentShell from "@/components/shell/student-shell";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const me = await requireUser("student");
  return <StudentShell me={me}>{children}</StudentShell>;
}

