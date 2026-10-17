import { openai, EMBEDDING_MODEL } from "./config";

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  embedding?: number[];
}

/**
 * Generate an embedding vector for a piece of text.
 * Used to encode both knowledge-base articles and user queries
 * so we can find the closest match via cosine similarity.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const sanitized = text.replace(/\n/g, " ").trim();

  if (!sanitized) {
    throw new Error("Cannot generate embedding for empty text.");
  }

  try {
    const response = await openai.createEmbedding({
      model: EMBEDDING_MODEL,
      input: sanitized,
    });

    const vector = response.data.data[0]?.embedding;

    if (!vector || vector.length === 0) {
      throw new Error("API returned an empty embedding vector.");
    }

    return vector;
  } catch (error: any) {
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/** Cosine similarity between two vectors. Returns a value in [-1, 1]. */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search a set of pre-embedded knowledge articles for the best match
 * to a user query. Returns the top N articles sorted by relevance.
 */
export async function searchKnowledgeBase(
  query: string,
  articles: KnowledgeArticle[],
  topN: number = 3
): Promise<Array<KnowledgeArticle & { score: number }>> {
  const queryEmbedding = await generateEmbedding(query);

  const scored = articles
    .filter((a) => a.embedding && a.embedding.length > 0)
    .map((article) => ({
      ...article,
      score: cosineSimilarity(queryEmbedding, article.embedding!),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}
