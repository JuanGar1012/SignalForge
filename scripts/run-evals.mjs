import { readFile } from "node:fs/promises";

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function retrieve(prompt, docs, limit = 3) {
  const queryTokens = tokenize(prompt);
  const scored = docs
    .map((doc) => {
      const contentTokens = new Set(tokenize(`${doc.title} ${doc.content}`));
      let score = 0;
      for (const token of queryTokens) {
        if (contentTokens.has(token)) {
          score += 1;
        }
      }
      return { ...doc, score };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const relevant = scored.filter((doc) => doc.score > 0).slice(0, limit);
  return relevant.length > 0 ? relevant : scored.slice(0, limit);
}

function buildMockGroundedOutput(citations) {
  return citations
    .map((citation) => `${citation.title}: ${citation.content} [source:${citation.id}]`)
    .join(" ");
}

async function run() {
  const [casesRaw, kbRaw] = await Promise.all([
    readFile(new URL("../evals/prompts.json", import.meta.url), "utf-8"),
    readFile(new URL("../src/data/knowledge-base.json", import.meta.url), "utf-8")
  ]);

  const cases = JSON.parse(casesRaw);
  const docs = JSON.parse(kbRaw);

  if (!Array.isArray(cases) || !Array.isArray(docs)) {
    throw new Error("Eval files must contain arrays");
  }

  const results = cases.map((testCase) => {
    const citations = retrieve(testCase.prompt, docs, 3);
    const output = buildMockGroundedOutput(citations).toLowerCase();
    const topCitation = citations[0]?.id ?? "";
    const outputTerms = Array.isArray(testCase.required_output_terms)
      ? testCase.required_output_terms.map((term) => String(term).toLowerCase())
      : [];

    const citationPass = topCitation === String(testCase.expected_citation);
    const outputPass = outputTerms.every((term) => output.includes(term));
    const pass = citationPass && outputPass;

    return {
      id: String(testCase.id),
      pass,
      citationPass,
      outputPass,
      expected: String(testCase.expected_citation),
      actual: topCitation
    };
  });

  const passed = results.filter((item) => item.pass).length;
  const total = results.length;
  const passRate = total === 0 ? 0 : Math.round((passed / total) * 100);
  const minPassRate = 80;

  console.log(`Eval results: ${passed}/${total} passed (${passRate}%), required >= ${minPassRate}%`);
  for (const result of results) {
    console.log(
      `${result.pass ? "PASS" : "FAIL"} ${result.id} expected=${result.expected} actual=${result.actual} citation=${
        result.citationPass
      } output=${result.outputPass}`
    );
  }

  if (passRate < minPassRate) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Eval harness failed:", error);
  process.exitCode = 1;
});
