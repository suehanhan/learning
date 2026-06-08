import { getSessionToken } from "@/server/auth/session";
import { verifySession } from "@/server/auth/jwt";

export async function getAuthedUser() {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

