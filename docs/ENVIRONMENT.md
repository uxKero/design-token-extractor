# Environment

This agent needs model access through the **Vercel AI Gateway**.

| Variable              | Required | What it is                                                                 |
| --------------------- | -------- | ------------------------------------------------------------------------- |
| `AI_GATEWAY_API_KEY`  | yes\*    | Vercel AI Gateway key. Resolves the model in `agent/agent.ts`.            |

\* On Vercel you can skip the key and run `vercel link` instead: the agent then uses the project's OIDC token for the Gateway automatically. Locally, copy `.env.example` to `.env.local` and paste a key.

No other keys are required, the tools only do plain HTTP fetches of public docs.

## Local

```bash
cp .env.example .env.local
# edit .env.local, set AI_GATEWAY_API_KEY
pnpm dev
```

## Vercel

Set `AI_GATEWAY_API_KEY` on the project (or link the project to use OIDC). The Deploy button prompts for it.
