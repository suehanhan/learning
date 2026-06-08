import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { nanoid } from "nanoid";
import { getAuthedUser } from "@/server/auth/api";

const schema = z.object({
  stateJson: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });

  const me = await getAuthedUser();
  const id = nanoid(10);

  await prisma.curveState.create({
    data: { id, stateJson: parsed.data.stateJson, ownerUserId: me?.sub ?? null },
  });

  return NextResponse.json({ shareId: id, url: `/student/simulator?share=${id}` });
}

