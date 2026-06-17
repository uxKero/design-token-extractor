---
description: Use when turning raw extracted CSS custom properties into a clean, semantic design-token report — how to group, name, annotate confidence, and optionally emit DTCG JSON.
---

# Building a design-token report

Follow this after `extract_css_vars` returns. The tool gives you grouped, deduped tokens;
your job is to make them legible and honest.

## 1. Structure the report

Lead with a one-line summary (counts per group), then a section per non-empty group, in
this order: **Color → Typography → Spacing → Radius → Shadow → Other.**

For each section use a small table:

| Token | Value |
| --- | --- |
| `--color-primary` | `#0070f3` |
| `--color-bg` | `oklch(0.99 0 0)` |

- Always show the real token name **with its leading `--`** and the verbatim value.
- For color tokens, you may add a swatch hint like `(blue)` only when the value is an
  unambiguous named/hex color — never approximate.
- Collapse obvious scales (e.g. `--space-1 … --space-8`) into a compact ordered list so
  the report stays scannable.

## 2. Annotate confidence

The grouping is heuristic, so be explicit:

- **High confidence:** name and value agree (e.g. `--radius-md: 8px`, `--color-fg: #111`).
- **Low confidence:** flag it. Common cases:
  - items in the **`other`** bucket (the tool couldn't classify them),
  - a `spacing` token whose value is unitless or a ratio,
  - a `--*-color` name whose value is itself a `var(...)` reference (an alias, not a raw value).
- If a token is an **alias** (its value references another custom property), say so — that
  is a real and useful design-system signal, not noise.

## 3. Note what you saw

Briefly state how many stylesheets and inline blocks were read, and call out if the byte
budget was hit or some stylesheets failed to download — that bounds how complete the
report is.

## 4. Optional: DTCG JSON

If the user wants a machine-readable file, emit a [DTCG](https://tr.designtokens.org/)-style
object, mapping groups to `$type` (`color`, `dimension`, `fontFamily`, `shadow`, …):

```json
{
  "color": {
    "primary": { "$type": "color", "$value": "#0070f3" }
  },
  "radius": {
    "md": { "$type": "dimension", "$value": "8px" }
  }
}
```

Derive the leaf key by stripping the group prefix from the token name (e.g.
`--color-primary` → `color.primary`). Keep `$value` verbatim. Only include tokens you
actually extracted.
