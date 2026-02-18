import { NextRequest, NextResponse } from "next/server";
import { requestIdHeader, readRequestId } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const requestId = readRequestId(request.headers);
  return NextResponse.json(
    {
      status: "ok",
      service: "signalforge-web",
      timestamp: new Date().toISOString()
    },
    { status: 200, headers: { [requestIdHeader]: requestId } }
  );
}
