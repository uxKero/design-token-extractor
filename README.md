<div align="center">

# 🎨 Design Token Extractor

**An Eve agent that turns any website into a design-token report** by reading its CSS, extracting every `--custom-property`, and grouping them into color, type, spacing, radius, and shadow. A web chat plus the agent, ready to deploy.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FuxKero%2Fdesign-token-extractor&env=AI_GATEWAY_API_KEY&envDescription=Model%20access%20via%20the%20Vercel%20AI%20Gateway&envLink=https%3A%2F%2Fgithub.com%2FuxKero%2Fdesign-token-extractor%2Fblob%2Fmain%2Fdocs%2FENVIRONMENT.md&project-name=design-token-extractor&repository-name=design-token-extractor)

[![Powered by Vercel](https://img.shields.io/badge/▲%20Powered%20by%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Built on Eve](https://img.shields.io/badge/Built%20on%20Eve-000000?style=for-the-badge)](https://eve.dev)
[![License MIT](https://img.shields.io/badge/License-MIT-3b3b3b?style=for-the-badge)](./LICENSE)

**▶ [Live demo](https://design-token-extractor.vercel.app)** · a visual preview (deploy your own, add a key, and it answers)

</div>

---

## How it works

Point it at any public website. It:

- **fetches** the page CSS, linked stylesheets and inline `<style>` (`extract_css_vars`),
- **extracts** every `--custom-property`,
- **groups** them into a semantic report: color, typography, spacing, radius, shadow, and more.

Great for reverse-engineering a design system, auditing your own tokens, or seeding a DTCG file. No keys beyond the model, the tool only does plain HTTP fetches.

Two services run on Vercel from [`vercel.json`](vercel.json): the **web** chat (Next.js) and the **eve** agent runtime, reached same-origin via `useEveAgent`.

## Deploy

Click the button above. Vercel clones this repo and asks for one variable, `AI_GATEWAY_API_KEY` (or link the project for OIDC). See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

## Run it locally

Requirements: **Node 24+**, pnpm.

```bash
pnpm install
cp .env.example .env.local   # add your AI Gateway key
pnpm dev                     # http://localhost:3000
```

## Inside the agent

```
agent/
├─ agent.ts                      # model (via the AI Gateway) + runtime
├─ instructions.md               # the persona + rules
├─ tools/
│  └─ extract_css_vars.ts        # fetches CSS, pulls --custom-properties
└─ skills/
   └─ token_report/SKILL.md      # how to group + present tokens
```

## Make it your own

- Run it against your own site to audit your tokens.
- Extend `extract_css_vars.ts` to emit a DTCG JSON file.
- Swap the model in `agent/agent.ts` (anything on the AI Gateway).

## Stack

[Vercel Eve](https://eve.dev) · [AI Gateway](https://vercel.com/ai-gateway) · [Next.js](https://nextjs.org) · deployed on [Vercel](https://vercel.com).

<sub>One of the Eve agent templates from <a href="https://github.com/uxKero">Eden</a>. MIT licensed.</sub>
