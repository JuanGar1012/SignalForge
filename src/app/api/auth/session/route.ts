import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { readRequestId, requestIdHeader } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const requestId = readRequestId(request.headers);
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200, headers: { [requestIdHeader]: requestId } });
  }

  return NextResponse.json(
    { authenticated: true, user: session },
    { status: 200, headers: { [requestIdHeader]: requestId } }
  );
}
