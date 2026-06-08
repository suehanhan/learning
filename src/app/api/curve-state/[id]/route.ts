import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = await prisma.curveState.findUnique({ where: { id }, select: { id: true, stateJson: true } });
  if (!row) return NextResponse.json({ error: "不存在" }, { status: 404 });
  return NextResponse.json({ id: row.id, stateJson: row.stateJson });
}

