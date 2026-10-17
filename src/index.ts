import { ChatCompletionMessageParam } from "openai/resources";
import { getCustomerSupportReply, quickAnswer } from "./chat";
import { generateEmbedding, searchKnowledgeBase } from "./embeddings";
import { moderateInput } from "./moderation";
import { summarizeTicket, generateTicketTitle } from "./summarize";
import { transcribeVoiceMessage } from "./transcribe";
import { generateSupportDiagram } from "./images";

/**
 * Process an incoming customer support message through the full pipeline:
 *   1. Moderate the input
 *   2. Search the knowledge base for relevant context
 *   3. Generate a chat response
 *   4. Return the result with metadata
 */
async function handleSupportMessage(
  userMessage: string,
  conversationHistory: ChatCompletionMessageParam[]
) {
  console.log(`\n--- Processing: "${userMessage.slice(0, 60)}..." ---`);

  // Step 1: Check content moderation
  const moderation = await moderateInput(userMessage);
  if (moderation.flagged) {
    console.warn(`Message flagged (${moderation.categories.join(", ")})`);
    return {
      reply: "I'm sorry, but I can't process that message. Please rephrase your question.",
      flagged: true,
    };
  }

  // Step 2: Get the bot's response
  const { reply, tokensUsed, finishReason } = await getCustomerSupportReply(
    conversationHistory,
    userMessage
  );

  console.log(`Reply generated (${tokensUsed} tokens, ${finishReason})`);

  return { reply, flagged: false, tokensUsed };
}

/**
 * Demo: run a short simulated support conversation to show all
 * features working end-to-end.
 */
async function main() {
  console.log("=== Acme Corp Customer Support Bot (OpenAI v4+) ===\n");

  // --- Chat demo ---
  const history: ChatCompletionMessageParam[] = [];
  const questions = [
    "Hi, I can't log into my account. It says my password is wrong.",
    "I already tried resetting it. The reset email never arrives.",
    "Can you escalate this to a human agent?",
  ];

  for (const question of questions) {
    const result = await handleSupportMessage(question, history);
    console.log(`Customer: ${question}`);
    console.log(`Bot: ${result.reply}\n`);

    history.push({ role: "user", content: question });
    history.push({ role: "assistant", content: result.reply });
  }

  // --- Summarization demo ---
  console.log("--- Generating ticket summary ---");
  const messages = questions.map((q, i) => `Customer: ${q}\nBot: (response ${i + 1})`);
  const summary = await summarizeTicket(messages);
  console.log(`Summary: ${summary.summary}`);
  console.log(`Sentiment: ${summary.sentiment}\n`);

  const title = await generateTicketTitle(questions[0]);
  console.log(`Ticket title: ${title}\n`);

  // --- Embedding demo ---
  console.log("--- Generating embedding for knowledge base search ---");
  const embedding = await generateEmbedding("password reset not working");
  console.log(`Embedding dimensions: ${embedding.length}\n`);

  // --- Quick answer demo ---
  console.log("--- Quick FAQ answer ---");
  const faqAnswer = await quickAnswer("What are your support hours?");
  console.log(`FAQ: ${faqAnswer}\n`);

  // --- Image demo (logged but not executed without API key) ---
  console.log("--- Support diagram generation ---");
  try {
    const diagram = await generateSupportDiagram(
      "password reset flow: user clicks forgot password, enters email, receives link, creates new password"
    );
    console.log(`Diagram URL: ${diagram.url}\n`);
  } catch (err: any) {
    console.log(`(Diagram skipped: ${err.message})\n`);
  }

  console.log("=== Demo complete ===");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
