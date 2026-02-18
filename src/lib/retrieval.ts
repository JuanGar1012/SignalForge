import knowledgeBase from "@/data/knowledge-base.json";

type KnowledgeDoc = {
  id: string;
  title: string;
  content: string;
};

export type Citation = {
  id: string;
  title: string;
  snippet: string;
  score: number;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function scoreDoc(queryTokens: string[], content: string): number {
  const contentTokens = tokenize(content);
  if (queryTokens.length === 0 || contentTokens.length === 0) {
    return 0;
  }

  const tokenSet = new Set(contentTokens);
  let score = 0;
  for (const token of queryTokens) {
    if (tokenSet.has(token)) {
      score += 1;
    }
  }
  return score;
}

export function retrieveCitations(query: string, limit = 3): Citation[] {
  const docs = knowledgeBase as KnowledgeDoc[];
  const queryTokens = tokenize(query);

  const scored = docs
    .map((doc) => {
      const score = scoreDoc(queryTokens, `${doc.title} ${doc.content}`);
      return {
        id: doc.id,
        title: doc.title,
        snippet: doc.content,
        score
      };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const relevant = scored.filter((doc) => doc.score > 0).slice(0, limit);
  if (relevant.length > 0) {
    return relevant;
  }

  return scored.slice(0, limit);
}

export function buildContextBlock(citations: Citation[]): string {
  return citations.map((citation) => `[${citation.id}] ${citation.snippet}`).join("\n");
}
