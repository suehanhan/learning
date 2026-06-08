import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getAuthedUser } from "@/server/auth/api";

export async function GET(req: Request) {
  const me = await getAuthedUser();
  if (!me) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const url = new URL(req.url);
  const module = url.searchParams.get("module") || "";

  const rows = await prisma.testReport.findMany({
    where: { userId: me.sub, ...(module ? { module: module as any } : {}) },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, module: true, score: true, aiAnalysis: true, createdAt: true },
  });

  return NextResponse.json({ reports: rows });
}

