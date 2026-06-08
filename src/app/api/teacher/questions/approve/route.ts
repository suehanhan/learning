import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getAuthedUser } from "@/server/auth/api";

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
});

export async function POST(req: Request) {
  const me = await getAuthedUser();
  if (!me || me.role !== "teacher") return NextResponse.json({ error: "无权限" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });

  const updated = await prisma.question.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  });

  return NextResponse.json({ question: updated });
}

