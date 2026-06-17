import { defineTool } from "eve/tools";
import { z } from "zod";

// Safety caps so a huge site can't blow the context window or hang the agent.
const MAX_STYLESHEETS = 20; // external stylesheets to download
const MAX_BYTES_PER_SHEET = 800_000; // ~0.8 MB per file
const MAX_TOTAL_BYTES = 4_000_000; // ~4 MB across all CSS
const FETCH_TIMEOUT_MS = 10_000;

type Group =
  | "color"
  | "typography"
  | "spacing"
  | "radius"
  | "shadow"
  | "other";

interface Token {
  name: string; // the custom property name, including the leading "--"
  value: string; // the declared value, trimmed
  group: Group;
  count: number; // how many times this exact name+value was seen
}

function normalizeUrl(input: string): string {
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  // Throws if still invalid — caller catches and reports.
  return new URL(s).toString();
}

async function fetchText(
  url: string,
  maxBytes: number
): Promise<{ ok: boolean; text?: string; status?: number; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // A realistic UA — some CDNs block the default fetch agent.
        "user-agent":
          "Mozilla/5.0 (compatible; EveDesignTokenExtractor/1.0; +https://eve.dev)",
        accept: "text/html,text/css,*/*",
      },
    });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    const raw = await res.text();
    return { ok: true, status: res.status, text: raw.slice(0, maxBytes) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

// Pull href values out of <link rel="stylesheet" ...> tags (attribute order varies).
function findStylesheetLinks(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const linkTag = /<link\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkTag.exec(html))) {
    const tag = m[0];
    if (!/\brel\s*=\s*["']?[^"'>]*stylesheet/i.test(tag)) continue;
    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) continue;
    try {
      urls.push(new URL(href, baseUrl).toString());
    } catch {
      // skip malformed hrefs
    }
  }
  return [...new Set(urls)];
}

// Pull the raw contents of every <style>...</style> block.
function findInlineStyles(html: string): string[] {
  const blocks: string[] = [];
  const styleTag = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = styleTag.exec(html))) {
    if (m[1].trim()) blocks.push(m[1]);
  }
  return blocks;
}

// Extract "--name: value" custom-property declarations from a chunk of CSS.
function extractCustomProperties(css: string): Array<{ name: string; value: string }> {
  const out: Array<{ name: string; value: string }> = [];
  // Match a custom property up to the next ; or closing }. Good enough for
  // the vast majority of real stylesheets without a full CSS parser.
  const re = /(--[A-Za-z0-9_-]+)\s*:\s*([^;{}]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    const name = m[1].trim();
    const value = m[2].trim().replace(/\s+/g, " ");
    if (!value || value === "initial" || value === "inherit" || value.startsWith("var("))
      continue;
    out.push({ name, value });
  }
  return out;
}

const COLOR_FN = /\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\s*\(/i;
const HEX = /#[0-9a-f]{3,8}\b/i;
const NAMED_COLORS = new Set([
  "transparent",
  "currentcolor",
  "white",
  "black",
  "red",
  "green",
  "blue",
  "gray",
  "grey",
  "silver",
  "yellow",
  "orange",
  "purple",
  "pink",
  "teal",
  "cyan",
  "magenta",
  "navy",
  "olive",
  "maroon",
  "lime",
  "aqua",
  "fuchsia",
]);
const LENGTH = /^-?[\d.]+(px|rem|em|vh|vw|vmin|vmax|ch|ex|%|pt)$/i;

function looksLikeColor(value: string): boolean {
  if (COLOR_FN.test(value) || HEX.test(value)) return true;
  return NAMED_COLORS.has(value.toLowerCase());
}

function looksLikeShadow(value: string): boolean {
  // A shadow has at least two lengths and usually a color, e.g.
  // "0 1px 2px rgba(0,0,0,.1)". Heuristic: 2+ length tokens.
  const lengths = value.match(/-?[\d.]+(px|rem|em)\b/gi);
  return !!lengths && lengths.length >= 2;
}

function classify(name: string, value: string): Group {
  const n = name.toLowerCase();

  // Name-based signals first — most reliable in real design systems.
  if (/(radius|rounded|corner)/.test(n)) return "radius";
  if (/(shadow|elevation)/.test(n)) return "shadow";
  if (
    /(font|family|leading|line-height|tracking|letter-spacing|weight|text-size|font-size)/.test(
      n
    )
  )
    return "typography";
  if (/(color|colour|bg|background|foreground|fill|stroke|brand|accent|primary|secondary|surface|border-color|ink|tint|shade|palette)/.test(n))
    return "color";
  if (/(space|spacing|gap|margin|padding|inset|gutter|size|width|height)/.test(n)) {
    // "size/width/height" can be a length token; keep it as spacing only if
    // the value reads like a dimension, otherwise fall through.
    if (LENGTH.test(value) || /\d/.test(value)) return "spacing";
  }

  // Value-based fallbacks.
  if (looksLikeColor(value)) return "color";
  if (looksLikeShadow(value)) return "shadow";
  if (LENGTH.test(value)) return "spacing";

  return "other";
}

export default defineTool({
  description:
    "Extract the design tokens of any public website. Fetches the page HTML, finds every linked <link rel=stylesheet> and inline <style> block, downloads the stylesheets, parses out all CSS custom properties (--name: value), and groups them heuristically into color / typography / spacing / radius / shadow / other. Use this when asked to extract, audit, or reverse-engineer a site's design tokens or design system. No API key needed — plain HTTP.",
  inputSchema: z.object({
    url: z
      .string()
      .min(1)
      .describe(
        "The page to analyze, e.g. https://vercel.com or just vercel.com. The homepage usually loads the main stylesheet."
      ),
  }),
  async execute({ url }) {
    let pageUrl: string;
    try {
      pageUrl = normalizeUrl(url);
    } catch {
      return { ok: false, error: `Invalid URL: ${url}` };
    }

    const page = await fetchText(pageUrl, MAX_BYTES_PER_SHEET);
    if (!page.ok || !page.text) {
      return { ok: false, url: pageUrl, error: page.error ?? "Failed to fetch page" };
    }
    const html = page.text;

    // 1. Inline <style> blocks (already on the page).
    const cssChunks: Array<{ source: string; css: string }> = findInlineStyles(html).map(
      (css, i) => ({ source: `inline #${i + 1}`, css })
    );

    // 2. External stylesheets.
    const links = findStylesheetLinks(html, pageUrl).slice(0, MAX_STYLESHEETS);
    const sheets: Array<{ url: string; ok: boolean; bytes?: number; error?: string }> = [];
    let totalBytes = html.length;

    for (const link of links) {
      if (totalBytes >= MAX_TOTAL_BYTES) {
        sheets.push({ url: link, ok: false, error: "skipped (byte budget reached)" });
        continue;
      }
      const sheet = await fetchText(link, MAX_BYTES_PER_SHEET);
      if (sheet.ok && sheet.text) {
        totalBytes += sheet.text.length;
        cssChunks.push({ source: link, css: sheet.text });
        sheets.push({ url: link, ok: true, bytes: sheet.text.length });
      } else {
        sheets.push({ url: link, ok: false, error: sheet.error });
      }
    }

    // 3. Parse + dedupe custom properties across all CSS.
    const seen = new Map<string, Token>();
    for (const { css } of cssChunks) {
      for (const { name, value } of extractCustomProperties(css)) {
        const key = `${name}=${value}`;
        const existing = seen.get(key);
        if (existing) {
          existing.count++;
        } else {
          seen.set(key, { name, value, group: classify(name, value), count: 1 });
        }
      }
    }

    const tokens = [...seen.values()].sort(
      (a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name)
    );

    // 4. Group for the model.
    const groups: Record<Group, Token[]> = {
      color: [],
      typography: [],
      spacing: [],
      radius: [],
      shadow: [],
      other: [],
    };
    for (const t of tokens) groups[t.group].push(t);

    const summary = Object.fromEntries(
      (Object.keys(groups) as Group[]).map((g) => [g, groups[g].length])
    );

    return {
      ok: true,
      url: pageUrl,
      stylesheets: {
        inlineBlocks: cssChunks.filter((c) => c.source.startsWith("inline")).length,
        external: sheets,
      },
      totalTokens: tokens.length,
      summary,
      groups,
      note:
        tokens.length === 0
          ? "No CSS custom properties found. The site may compile tokens away at build time (e.g. into hashed class names) rather than expose them as :root variables. Report this honestly."
          : "Tokens grouped heuristically. Verify ambiguous ones (especially 'other' and 'spacing') against their names and values before presenting.",
    };
  },
});
