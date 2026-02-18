import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { readRequestId, requestIdHeader } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const requestId = readRequestId(request.headers);
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { [requestIdHeader]: requestId } });
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Protected endpoint reachable",
      user: session.email
    },
    { status: 200, headers: { [requestIdHeader]: requestId } }
  );
}
