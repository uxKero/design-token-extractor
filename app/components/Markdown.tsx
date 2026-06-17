"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const FILE_RE = /^(?:\/\/|#)\s*([A-Za-z0-9_./-]+\.[A-Za-z0-9]+)\s*$/;

function downloadFile(name: string, content: string) {
  const safe = name.split("/").pop() || name;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safe;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Dark-theme markdown for agent replies; code blocks are collapsible + downloadable. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="marker:text-muted">{children}</li>,
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const text = String(children ?? "").replace(/\n$/, "");
            const isBlock = /language-/.test(className || "") || text.includes("\n");
            if (!isBlock) {
              return (
                <code className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[0.8em] text-foreground">
                  {children}
                </code>
              );
            }
            const firstLine = text.split("\n")[0].trim();
            const m = firstLine.match(FILE_RE);
            const filename = m?.[1];
            const body = filename
              ? text.split("\n").slice(1).join("\n").replace(/^\n+/, "")
              : text;
            const lines = body.split("\n").length;
            return (
              <details className="group/code overflow-hidden rounded-lg border border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-surface-subtle px-3 py-1.5 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2 font-mono text-xs text-muted">
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 10 10"
                      className="transition-transform group-open/code:rotate-90"
                      aria-hidden
                    >
                      <path d="M3 1l5 4-5 4z" fill="currentColor" />
                    </svg>
                    {filename || "code"}
                    <span className="text-border">·</span>
                    <span className="text-muted/70">{lines} lines</span>
                  </span>
                  {filename && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadFile(filename, body);
                      }}
                      className="font-mono text-xs text-secondary transition-colors hover:text-foreground"
                    >
                      Download
                    </button>
                  )}
                </summary>
                <pre className="overflow-x-auto border-t border-border bg-surface-subtle/60 p-3">
                  <code className="font-mono text-xs leading-relaxed text-foreground">
                    {body}
                  </code>
                </pre>
              </details>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
