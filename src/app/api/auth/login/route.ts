import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sessionCookieConfig, signSession } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { logInfo, readRequestId, requestIdHeader } from "@/lib/observability";

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: NextRequest) {
  const env = getEnv();
  const requestId = readRequestId(request.headers);
  const json = await request.json().catch(() => null);
  const parsed = loginBodySchema.safeParse(json);

  if (!parsed.success) {
    logInfo("auth.login.bad_request", { requestId });
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400, headers: { [requestIdHeader]: requestId } }
    );
  }

  const { email, password } = parsed.data;
  if (email !== env.AUTH_DEMO_USER || password !== env.AUTH_DEMO_PASSWORD) {
    logInfo("auth.login.invalid_credentials", { requestId, email });
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401, headers: { [requestIdHeader]: requestId } }
    );
  }

  const token = await signSession({ id: "demo-user-1", email, role: "user" });
  const cookieStore = await cookies();
  const cookie = sessionCookieConfig();

  cookieStore.set(cookie.name, token, cookie.options);
  logInfo("auth.login.success", { requestId, email });
  return NextResponse.json({ ok: true }, { status: 200, headers: { [requestIdHeader]: requestId } });
}
