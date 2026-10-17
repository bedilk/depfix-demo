import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing OPENAI_API_KEY environment variable. " +
      "Copy .env.example to .env and add your key."
  );
}

const configuration = new Configuration({
  apiKey,
  organization: process.env.OPENAI_ORG_ID,
});

/**
 * Shared OpenAI v3 client used by every module in the support bot.
 * All API calls go through this single instance so we can swap
 * keys or orgs in one place.
 */
export const openai = new OpenAIApi(configuration);

/** Default model for chat-based interactions. */
export const CHAT_MODEL = "gpt-3.5-turbo";

/** Default model for legacy completions (summarization, etc.). */
export const COMPLETION_MODEL = "text-davinci-003";

/** Default embedding model for knowledge-base search. */
export const EMBEDDING_MODEL = "text-embedding-ada-002";

/** Max tokens we allow in a single chat response. */
export const MAX_RESPONSE_TOKENS = 1024;

/** System prompt that frames the bot as a support agent. */
export const SYSTEM_PROMPT =
  "You are a helpful customer support agent for Acme Corp. " +
  "Be concise, empathetic, and solution-oriented. " +
  "If you don't know the answer, say so and offer to escalate.";
