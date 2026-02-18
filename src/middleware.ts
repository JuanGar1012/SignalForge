import { NextRequest, NextResponse } from "next/server";
import { requestIdHeader } from "@/lib/observability";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const current = requestHeaders.get(requestIdHeader);
  const requestId = current && current.length > 0 ? current : crypto.randomUUID();
  requestHeaders.set(requestIdHeader, requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
  response.headers.set(requestIdHeader, requestId);
  return response;
}

export const config = {
  matcher: ["/api/:path*"]
};
