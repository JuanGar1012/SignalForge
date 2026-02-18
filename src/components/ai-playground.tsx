"use client";

import { FormEvent, useState } from "react";

type AiApiResponse = {
  ok: true;
  provider: "openai" | "mock";
  model: string;
  output: string;
  citations: Array<{
    id: string;
    title: string;
    snippet: string;
    score: number;
  }>;
  latencyMs: number;
};

type AiApiError = {
  error: string;
};

export function AiPlayground() {
  const [prompt, setPrompt] = useState("Summarize why API validation matters in two sentences.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiApiResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/ai/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const body = (await response.json()) as AiApiResponse | AiApiError;
    if (!response.ok) {
      setResult(null);
      setError("error" in body ? body.error : "Request failed");
      setLoading(false);
      return;
    }

    setResult(body as AiApiResponse);
    setLoading(false);
  }

  return (
    <div className="card">
      <h2>AI Playground</h2>
      <p>Protected deterministic AI route: `POST /api/ai/respond`</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="prompt">Prompt</label>
        <input
          id="prompt"
          name="prompt"
          required
          minLength={5}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>
      {error ? <p>{error}</p> : null}
      {result ? (
        <div>
          <p>
            Provider: {result.provider} | Model: {result.model} | Latency: {result.latencyMs}ms
          </p>
          <p>{result.output}</p>
          <p>Top citations:</p>
          <ul>
            {result.citations.map((citation) => (
              <li key={citation.id}>
                {citation.title} ({citation.id}, score={citation.score})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
