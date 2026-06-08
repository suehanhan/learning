import { NextResponse } from "next/server";
import { getSessionToken } from "@/server/auth/session";
import { verifySession } from "@/server/auth/jwt";
import { prisma } from "@/server/db";

export async function GET() {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ user: null });

  try {
    const claims = await verifySession(token);
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, role: true, name: true, email: true, classGroup: true },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

