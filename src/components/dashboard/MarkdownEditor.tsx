"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Sparkles, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { optimizePrompt } from "@/actions/ai";
import { useIsPro } from "@/components/dashboard/ProProvider";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";

// When provided, the header shows the AI Optimize button (Prompt in the item drawer only);
// onApply receives the optimized text once the user confirms it
interface OptimizeContext {
  title: string;
  onApply: (text: string) => void;
}

interface MarkdownEditorProps {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  optimize?: OptimizeContext;
}

export default function MarkdownEditor({ value, readOnly = false, onChange, optimize }: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">(readOnly ? "preview" : "write");
  const { copied, copy } = useCopyToClipboard();
  const isPro = useIsPro();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [suggestion, setSuggestion] = useState<{ text: string; source: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Suggestions are not persisted; one made for different text (after an edit) is stale and dropped
  const pending = suggestion && suggestion.source === value ? suggestion.text : null;

  // tab and pending are deps because the textarea is remounted without a height when they change
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(80, Math.min(400, el.scrollHeight))}px`;
  }, [value, tab, pending]);

  const handleOptimize = async () => {
    if (!optimize) return;
    setIsOptimizing(true);
    try {
      const result = await optimizePrompt({ title: optimize.title, content: value, typeName: "Prompt" });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (!result.data.changed) {
        toast.success("This prompt is already well written.");
        return;
      }
      setSuggestion({ text: result.data.prompt, source: value });
    } catch {
      toast.error("AI request failed.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleUse = () => {
    if (pending === null || !optimize) return;
    setSuggestion(null);
    optimize.onApply(pending);
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
          {optimize && isPro === true && (
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || !value.trim()}
              className="cursor-pointer flex items-center gap-1 text-xs text-[#858585] hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Optimize prompt"
              title="Optimize prompt"
              type="button"
            >
              {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Optimize
            </button>
          )}
          {optimize && isPro === false && (
            <span
              className="flex items-center gap-1 text-xs text-[#858585]"
              title="AI features require Pro subscription"
            >
              <Crown className="w-3.5 h-3.5" />
              Optimize
            </span>
          )}
          <button
            onClick={() => copy(value)}
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

      {/* Optimized suggestion: shown instead of the editor until the user accepts or discards it */}
      {pending !== null && (
        <>
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40 border-b border-border">
            <span className="text-xs text-muted-foreground">Use the optimized prompt?</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSuggestion(null)}
                className="cursor-pointer text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleUse}
                className="cursor-pointer text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Use optimized
              </button>
            </div>
          </div>
          <div
            className="markdown-preview bg-background p-3 overflow-y-auto"
            style={{ minHeight: 80, maxHeight: 400 }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{pending}</ReactMarkdown>
          </div>
        </>
      )}

      {/* Write tab */}
      {pending === null && tab === "write" && !readOnly && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-background text-foreground text-xs font-mono leading-relaxed outline-none resize-none p-3 block"
          style={{ minHeight: 80, maxHeight: 400, overflowY: "auto" }}
          placeholder="Write markdown…"
          spellCheck={false}
        />
      )}

      {/* Preview tab */}
      {pending === null && (tab === "preview" || readOnly) && (
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