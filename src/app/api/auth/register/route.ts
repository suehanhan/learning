import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { signSession } from "@/server/auth/jwt";
import { setSessionCookie } from "@/server/auth/session";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  classGroup: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return NextResponse.json({ error: "邮箱已注册" }, { status: 409 });

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      role: "student",
      name: parsed.data.name,
      email: parsed.data.email,
      classGroup: parsed.data.classGroup,
      passwordHash,
    },
    select: { id: true, role: true, name: true, email: true, classGroup: true },
  });

  const token = await signSession({ sub: user.id, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({ user });
}

