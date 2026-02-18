import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";
import { sessionMaxAgeSeconds, signSession, verifySession, type SessionUser } from "@/lib/session-token";

export { signSession, verifySession, type SessionUser };

const defaultCookieName = "signalforge_session";

function getCookieName(): string {
  return process.env.AUTH_COOKIE_NAME ?? defaultCookieName;
}

export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCookieName())?.value;
  if (!token) {
    return null;
  }
  return verifySession(token);
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(getCookieName())?.value;
  if (!token) {
    return null;
  }
  return verifySession(token);
}

export function sessionCookieConfig() {
  const env = getEnv();
  return {
    name: env.AUTH_COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: sessionMaxAgeSeconds
    }
  };
}
