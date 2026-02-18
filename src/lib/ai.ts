import { z } from "zod";
import { buildContextBlock, retrieveCitations, type Citation } from "@/lib/retrieval";

const openAiResponseSchema = z.object({
  model: z.string(),
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable().optional()
        })
      })
    )
    .min(1)
});

export type AiResult = {
  provider: "openai" | "mock";
  model: string;
  output: string;
  citations: Citation[];
  latencyMs: number;
};

const defaultModel = "gpt-4.1-mini";

function getOpenAiConfig(): { apiKey: string | null; model: string } {
  const apiKey = process.env.OPENAI_API_KEY ?? null;
  const model = process.env.OPENAI_MODEL ?? defaultModel;
  return { apiKey, model };
}

function buildMockResponse(citations: Citation[]): string {
  const context = citations
    .map((citation) => `${citation.title}: ${citation.snippet} [source:${citation.id}]`)
    .join(" ");

  return `Grounded summary: ${context}`;
}

export async function generateResponse(prompt: string): Promise<AiResult> {
  const startedAt = Date.now();
  const { apiKey, model } = getOpenAiConfig();
  const citations = retrieveCitations(prompt, 3);
  const contextBlock = buildContextBlock(citations);

  if (!apiKey) {
    return {
      provider: "mock",
      model: "mock-deterministic-v1",
      output: buildMockResponse(citations),
      citations,
      latencyMs: Date.now() - startedAt
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      top_p: 1,
      messages: [
        {
          role: "system",
          content:
            "You are a concise AI assistant for SignalForge. Answer only with facts supported by provided context and cite sources as [source:<id>]."
        },
        {
          role: "user",
          content: `Question: ${prompt}\n\nContext:\n${contextBlock}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const raw = await response.json();
  const parsed = openAiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("OpenAI response schema validation failed");
  }

  const output = parsed.data.choices[0]?.message.content?.trim();
  if (!output) {
    throw new Error("OpenAI response content missing");
  }

  return {
    provider: "openai",
    model: parsed.data.model,
    output,
    citations,
    latencyMs: Date.now() - startedAt
  };
}
