import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/server/auth/jwt";
import { SESSION_COOKIE } from "@/server/auth/constants";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? null;

  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const claims = await verifySession(token);

    if (pathname.startsWith("/student") && claims.role !== "student") {
      return NextResponse.redirect(new URL("/teacher", req.url));
    }

    if (pathname.startsWith("/teacher") && claims.role !== "teacher") {
      return NextResponse.redirect(new URL("/student", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*"],
};

