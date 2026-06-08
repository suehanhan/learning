import { SignJWT, jwtVerify } from "jose";

export type UserRole = "student" | "teacher";

export type SessionClaims = {
  sub: string;
  role: UserRole;
};

function getSecret() {
  const raw = process.env.AUTH_SECRET;
  if (!raw) throw new Error("缺少 AUTH_SECRET");
  return new TextEncoder().encode(raw);
}

export async function signSession(claims: SessionClaims, expiresIn = "7d") {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, getSecret());
  const sub = payload.sub;
  const role = payload.role;

  if (typeof sub !== "string") throw new Error("会话无效");
  if (role !== "student" && role !== "teacher") throw new Error("会话无效");

  return { sub, role };
}

