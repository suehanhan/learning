import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { verifyPassword } from "@/server/auth/password";
import { signSession } from "@/server/auth/jwt";
import { setSessionCookie } from "@/server/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, role: true, name: true, email: true, classGroup: true, passwordHash: true },
  });
  if (!user) return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });

  const token = await signSession({ sub: user.id, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, role: user.role, name: user.name, email: user.email, classGroup: user.classGroup },
  });
}

