import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { generateResponse } from "@/lib/ai";
import { logError, logInfo, readRequestId, requestIdHeader } from "@/lib/observability";

const aiRequestSchema = z.object({
  prompt: z.string().min(5).max(4000)
});

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = readRequestId(request.headers);
  const session = await getSessionFromRequest(request);
  if (!session) {
    logInfo("ai.respond.unauthorized", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { [requestIdHeader]: requestId } });
  }

  const json = await request.json().catch(() => null);
  const parsed = aiRequestSchema.safeParse(json);
  if (!parsed.success) {
    logInfo("ai.respond.bad_request", { requestId, userId: session.id });
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400, headers: { [requestIdHeader]: requestId } }
    );
  }

  try {
    const result = await generateResponse(parsed.data.prompt);
    logInfo("ai.respond.success", {
      requestId,
      userId: session.id,
      provider: result.provider,
      latencyMs: Date.now() - startedAt
    });
    return NextResponse.json(
      {
        ok: true,
        provider: result.provider,
        model: result.model,
        output: result.output,
        citations: result.citations,
        latencyMs: result.latencyMs
      },
      { status: 200, headers: { [requestIdHeader]: requestId } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI generation failed";
    logError("ai.respond.failed", { requestId, userId: session.id, message });
    return NextResponse.json({ error: message }, { status: 502, headers: { [requestIdHeader]: requestId } });
  }
}
