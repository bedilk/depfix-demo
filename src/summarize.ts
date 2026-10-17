import { openai, CHAT_MODEL } from "./config";

interface TicketSummary {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  tokensUsed: number;
}

/**
 * Summarize a customer support ticket conversation using the
 * chat completions API. Produces a short summary and a sentiment
 * reading for the ticket dashboard.
 */
export async function summarizeTicket(
  ticketMessages: string[]
): Promise<TicketSummary> {
  const transcript = ticketMessages
    .map((msg, i) => `Message ${i + 1}: ${msg}`)
    .join("\n");

  const prompt =
    `Summarize this customer support conversation in 2-3 sentences. ` +
    `Then on a new line, classify the customer sentiment as POSITIVE, NEUTRAL, or NEGATIVE.\n\n` +
    `--- Conversation ---\n${transcript}\n\n--- Summary ---\n`;

  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 256,
      temperature: 0.3,
    });

    const rawText = response.choices[0]?.message?.content?.trim() ?? "";
    const lines = rawText.split("\n").filter((l) => l.trim());

    const summaryLines = lines.slice(0, -1);
    const sentimentLine = lines[lines.length - 1]?.toUpperCase() ?? "";

    let sentiment: TicketSummary["sentiment"] = "neutral";
    if (sentimentLine.includes("POSITIVE")) {
      sentiment = "positive";
    } else if (sentimentLine.includes("NEGATIVE")) {
      sentiment = "negative";
    }

    return {
      summary: summaryLines.join(" ") || rawText,
      sentiment,
      tokensUsed: response.usage?.total_tokens ?? 0,
    };
  } catch (error: any) {
    throw new Error(`Ticket summarization failed: ${error.message}`);
  }
}

/**
 * Generate a one-line title for a support ticket based on the
 * first customer message. Used in dashboards and email subjects.
 */
export async function generateTicketTitle(
  firstMessage: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "user",
        content:
          `Generate a short, descriptive title (max 10 words) for a ` +
          `support ticket that starts with:\n"${firstMessage}"\n\nTitle:`,
      },
    ],
    max_tokens: 32,
    temperature: 0.5,
  });

  return response.choices[0]?.message?.content?.trim() ?? "Untitled Ticket";
}
