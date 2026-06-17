# AGENTS.md

Guidance for AI coding agents working in this repo.

## What this is

A **Vercel Eve** agent (`agent/`) plus a minimal Next.js chat UI (`app/`). The browser talks to the agent via `useEveAgent` (from `eve/react`), same origin, wired by `withEve` in `next.config.ts`.

## Layout

- `agent/agent.ts` , `defineAgent({ model })`. Model resolves through the Vercel AI Gateway.
- `agent/instructions.md` , the system prompt.
- `agent/tools/*.ts` , `defineTool` actions, auto-discovered by location (no registry).
- `agent/skills/*` , longer procedures.
- `app/` , the Next.js chat UI.
- `vercel.json` , two services on Vercel: `web` (Next.js) and `eve` (agent runtime).

## Rules

- Eve needs **Node.js 24+** and **zod v4**.
- Do not add fields to `defineAgent` other than the documented ones (model, runtime options). Tools and instructions are discovered by file location, not listed in `agent.ts`.
- Keep tools typed with zod. Return plain data.
- Run `pnpm typecheck` and `pnpm build` before committing.

## Commands

```bash
pnpm dev         # Next.js chat + auto-started Eve agent
pnpm build       # next build (the eve service builds with `eve build` on Vercel)
pnpm typecheck
```
