import { ChatCompletionMessageParam } from "openai/resources";
import { openai, CHAT_MODEL, MAX_RESPONSE_TOKENS, SYSTEM_PROMPT } from "./config";

interface ChatResponse {
  reply: string;
  tokensUsed: number;
  finishReason: string | undefined;
}

/**
 * Send a customer message to the support bot and get a response.
 * Maintains conversation history so the bot has context.
 */
export async function getCustomerSupportReply(
  conversationHistory: ChatCompletionMessageParam[],
  userMessage: string
): Promise<ChatResponse> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      max_tokens: MAX_RESPONSE_TOKENS,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0.3,
      presence_penalty: 0.1,
    });

    const choice = response.choices[0];
    const reply = choice?.message?.content ?? "I'm sorry, I couldn't generate a response.";

    return {
      reply: reply.trim(),
      tokensUsed: response.usage?.total_tokens ?? 0,
      finishReason: choice?.finish_reason,
    };
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    if (error.status === 401) {
      throw new Error("Invalid API key. Check your OPENAI_API_KEY configuration.");
    }
    throw new Error(`Chat completion failed: ${error.message}`);
  }
}

/**
 * Quick single-turn reply for simple FAQ-style questions.
 * No conversation history — just question in, answer out.
 */
export async function quickAnswer(question: string): Promise<string> {
  const { reply } = await getCustomerSupportReply([], question);
  return reply;
}
