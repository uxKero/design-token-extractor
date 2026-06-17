"use client";

import { useEffect, useRef, useState } from "react";
import { useEveAgent } from "eve/react";
import { Markdown } from "./components/Markdown";

const SUGGESTIONS = [
  "Extract the design tokens from vercel.com",
  "What colors and type scale does stripe.com use?",
];

type Part = { type: string; text?: string };
type Message = { id?: string; role: string; parts?: Part[] };

function textOf(m: Message): string {
  return (m.parts ?? [])
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("\n\n");
}

export default function Page() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const agent = useEveAgent();
  const messages = (agent.data?.messages ?? []) as Message[];
  const busy = agent.status === "submitted" || agent.status === "streaming";
  const empty = messages.length === 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, agent.status]);

  function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    void agent.send({ message: q });
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col px-4">
      <header className="flex items-center justify-between border-b border-border py-4">
        <div>
          <h1 className="text-sm font-semibold tracking-tight">Design Token Extractor</h1>
          <p className="text-xs text-muted">An Eve agent that reads a site&apos;s CSS into design tokens.</p>
        </div>
        <a
          href="https://eve.dev"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-accent hover:underline"
        >
          Built on Eve ↗
        </a>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-6">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="text-lg font-medium tracking-tight">Turn any site into design tokens</h2>
            <p className="mt-1.5 max-w-sm text-sm text-muted">
              Give it a URL. It reads the page CSS and groups every custom property into a token report.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface-subtle px-4 py-2 text-xs text-secondary transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const text = textOf(m);
            if (!text) return null;
            if (m.role === "user") {
              return (
                <div key={m.id ?? i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-foreground px-4 py-2.5 text-sm text-surface">
                    {text}
                  </div>
                </div>
              );
            }
            return (
              <div key={m.id ?? i} className="flex justify-start">
                <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-border bg-surface-subtle px-4 py-3 text-foreground">
                  <Markdown>{text}</Markdown>
                </div>
              </div>
            );
          })
        )}
        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-surface-subtle px-4 py-3">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="dot h-1.5 w-1.5 rounded-full bg-muted"
                  style={{ animationDelay: `${d * 0.18}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-border py-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-subtle px-3 py-2 focus-within:border-foreground/30">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Paste a website URL..."
            className="max-h-32 flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-surface transition-opacity disabled:opacity-30"
            aria-label="Send"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M8 13V3M8 3l-4 4M8 3l4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </form>
    </main>
  );
}
