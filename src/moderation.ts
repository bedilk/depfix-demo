import { openai } from "./config";

interface ModerationResult {
  flagged: boolean;
  categories: string[];
  severity: "none" | "low" | "medium" | "high";
}

/**
 * Check user input against OpenAI's moderation endpoint before
 * processing it through the support bot. We reject flagged messages
 * to keep the support channel safe for agents and other customers.
 */
export async function moderateInput(text: string): Promise<ModerationResult> {
  if (!text.trim()) {
    return { flagged: false, categories: [], severity: "none" };
  }

  try {
    const response = await openai.createModeration({
      input: text,
    });

    const result = response.data.results[0];

    if (!result) {
      throw new Error("Moderation API returned no results.");
    }

    const flaggedCategories: string[] = [];
    const categories = result.categories as Record<string, boolean>;

    for (const [category, isFlagged] of Object.entries(categories)) {
      if (isFlagged) {
        flaggedCategories.push(category);
      }
    }

    // Determine severity from the category scores
    const scores = result.category_scores as Record<string, number>;
    const maxScore = Math.max(...Object.values(scores));

    let severity: ModerationResult["severity"] = "none";
    if (maxScore > 0.8) {
      severity = "high";
    } else if (maxScore > 0.5) {
      severity = "medium";
    } else if (maxScore > 0.2) {
      severity = "low";
    }

    return {
      flagged: result.flagged,
      categories: flaggedCategories,
      severity,
    };
  } catch (error: any) {
    // Fail open: if moderation is down, log the error but let the
    // message through. Better to serve customers than block on a
    // moderation outage.
    console.error(`Moderation check failed: ${error.message}`);
    return { flagged: false, categories: [], severity: "none" };
  }
}

/**
 * Batch-moderate an array of messages. Useful for checking a full
 * conversation history when resuming a support session.
 */
export async function moderateBatch(
  messages: string[]
): Promise<ModerationResult[]> {
  return Promise.all(messages.map((msg) => moderateInput(msg)));
}
