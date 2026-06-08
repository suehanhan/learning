import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getAuthedUser } from "@/server/auth/api";

export async function GET() {
  const me = await getAuthedUser();
  if (!me || me.role !== "teacher") return NextResponse.json({ error: "无权限" }, { status: 403 });

  const rows = await prisma.question.findMany({
    where: { source: "uploaded", status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, content: true, imageUrl: true, createdAt: true },
  });

  return NextResponse.json({ questions: rows });
}

