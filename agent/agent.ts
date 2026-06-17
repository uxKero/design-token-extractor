import { defineAgent } from "eve";

// Model routed through Vercel AI Gateway — no per-provider API key needed.
// Sonnet 4.6 is a good cost/quality fit for grouping and summarizing tokens;
// swap to "anthropic/claude-opus-4.8" for harder semantic reasoning.
export default defineAgent({
  model: "anthropic/claude-sonnet-4.6",
});
