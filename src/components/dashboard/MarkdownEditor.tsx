"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

export default function MarkdownEditor({ value, readOnly = false, onChange }: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">(readOnly ? "preview" : "write");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(400, el.scrollHeight)}px`;
  }, [value]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="rounded-md overflow-hidden border border-border">
      {/* Header bar — matches CodeEditor style */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1e1e1e] border-b border-[#2d2d2d]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex items-center gap-2.5">
          {!readOnly && (
            <div className="flex items-center gap-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTab("write")}
                className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${
                  tab === "write"
                    ? "text-white bg-[#3a3a3a]"
                    : "text-[#858585] hover:text-white"
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${
                  tab === "preview"
                    ? "text-white bg-[#3a3a3a]"
                    : "text-[#858585] hover:text-white"
                }`}
              >
                Preview
              </button>
            </div>
          )}
          <button
            onClick={handleCopy}
            className="cursor-pointer text-[#858585] hover:text-white transition-colors"
            aria-label="Copy content"
            type="button"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Write tab */}
      {tab === "write" && !readOnly && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-background text-foreground text-xs font-mono leading-relaxed outline-none resize-none p-3 block"
          style={{ minHeight: 400, overflowY: "hidden" }}
          placeholder="Write markdown…"
          spellCheck={false}
        />
      )}

      {/* Preview tab */}
      {(tab === "preview" || readOnly) && (
        <div
          className="markdown-preview bg-background p-3 overflow-y-auto"
          style={{ minHeight: 80, maxHeight: 400 }}
        >
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <span className="text-muted-foreground text-xs italic">Nothing to preview</span>
          )}
        </div>
      )}
    </div>
  );
}