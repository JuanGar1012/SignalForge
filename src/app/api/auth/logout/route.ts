import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { logInfo, readRequestId, requestIdHeader } from "@/lib/observability";

export async function POST(request: NextRequest) {
  const env = getEnv();
  const requestId = readRequestId(request.headers);
  const cookieStore = await cookies();
  cookieStore.set(env.AUTH_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  logInfo("auth.logout.success", { requestId });
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
    headers: { [requestIdHeader]: requestId }
  });
}
