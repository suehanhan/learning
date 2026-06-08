import { redirect } from "next/navigation";
import { getSessionToken } from "@/server/auth/session";
import { verifySession, type UserRole } from "@/server/auth/jwt";

export async function requireUser(expectedRole?: UserRole) {
  const token = await getSessionToken();
  if (!token) redirect("/login");

  const claims = await verifySession(token);
  if (expectedRole && claims.role !== expectedRole) {
    redirect(claims.role === "teacher" ? "/teacher" : "/student");
  }

  return claims;
}

