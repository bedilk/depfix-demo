# depfix-demo

A small **AI customer support bot** built on OpenAI **v3** (`openai@3.3.0`).

This repo exists to demonstrate [**depfix**](https://github.com/bedilk/depfix) — a tool that detects breaking SDK changes and generates migration pull requests automatically.

## Why OpenAI v3?

This project intentionally uses the **old v3 API** (`Configuration`, `OpenAIApi`, `createChatCompletion`, etc.). The v4 SDK is a complete rewrite with a different interface: new constructor, different method names, responses returned directly instead of wrapped in `.data`, and more.

Upgrading by hand means touching every file, updating imports, rewriting every call site, and fixing the response unwrapping. **depfix** does all of that in a single PR.

## What's in the box

| File | OpenAI v3 method | Purpose |
|---|---|---|
| `src/config.ts` | `new Configuration()` / `new OpenAIApi()` | Shared client setup |
| `src/chat.ts` | `createChatCompletion()` | Customer support replies |
| `src/embeddings.ts` | `createEmbedding()` | Knowledge base search |
| `src/moderation.ts` | `createModeration()` | Input safety checks |
| `src/summarize.ts` | `createCompletion()` | Ticket summarization |
| `src/transcribe.ts` | `createTranscription()` | Voice message processing |
| `src/images.ts` | `createImage()` | Support diagram generation |
| `src/index.ts` | _(orchestrator)_ | Ties everything together |

## See the depfix migration PR

<!-- TODO: replace with actual PR link once depfix runs -->
> **Coming soon** — depfix will open a PR that migrates this entire codebase from OpenAI v3 to v4. Check back for the link.

## Running locally

```bash
npm install
cp .env.example .env   # add your OPENAI_API_KEY
npm start
```

## License

MIT
