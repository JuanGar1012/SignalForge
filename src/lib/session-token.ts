import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/lib/env";

const encoder = new TextEncoder();
const maxAgeSeconds = 60 * 60 * 8;

export const sessionMaxAgeSeconds = maxAgeSeconds;

export type SessionUser = {
  id: string;
  email: string;
  role: "user";
};

type SessionPayload = {
  sub: string;
  email: string;
  role: "user";
};

function getJwtKey(): Uint8Array {
  return encoder.encode(getEnv().AUTH_JWT_SECRET);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getJwtKey());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getJwtKey(), { algorithms: ["HS256"] });
    if (!payload.sub || !payload.email || payload.role !== "user") {
      return null;
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}
