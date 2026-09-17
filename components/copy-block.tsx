"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyBlock({
  label,
  value,
  language = "bash",
}: {
  label: string;
  value: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-subtle">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted transition hover:bg-card hover:text-foreground"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Kopiert" : "Kopieren"}
        </button>
      </div>
      <pre className="max-h-80 overflow-auto px-4 py-3 font-mono text-[12px] leading-6 text-foreground/90">
        <code data-language={language}>{value}</code>
      </pre>
    </div>
  );
}
