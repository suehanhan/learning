import type { QuestionType } from "@prisma/client";

export function normalizeAnswer(type: QuestionType, raw: string) {
  const s = (raw || "").trim();
  if (type === "choice") return s.toUpperCase().replace(/[^A-D]/g, "");
  return s.replace(/\s+/g, "");
}

