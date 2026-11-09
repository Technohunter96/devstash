"use client";

import { useState } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Sparkles, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { explainCode } from "@/actions/ai";
import { useIsPro } from "@/components/dashboard/ProProvider";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import { useEditorPreferences } from "@/components/dashboard/EditorPreferencesProvider";
import { defineCustomMonacoThemes } from "@/lib/monaco-themes";

// When provided, the header shows the AI Explain button (Snippet/Command in the item drawer only)
interface ExplainContext {
  title: string;
  typeName: "Snippet" | "Command";
}

interface CodeEditorProps {
  value: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  explain?: ExplainContext;
}

const TAB_CLASS = "cursor-pointer px-2 py-0.5 rounded transition-colors";

export default function CodeEditor({ value, language, readOnly = false, onChange, explain }: CodeEditorProps) {
  const { copied, copy } = useCopyToClipboard();
  const isPro = useIsPro();
  const [explained, setExplained] = useState<{ text: string; source: string } | null>(null);
  const [tab, setTab] = useState<"code" | "explain">("code");
  const [isExplaining, setIsExplaining] = useState(false);
  const { preferences } = useEditorPreferences();
  const minHeight = 80;
  const [editorHeight, setEditorHeight] = useState(minHeight);

  const handleBeforeMount: BeforeMount = (monaco) => {
    defineCustomMonacoThemes(monaco);
  };

  const handleMount: OnMount = (editorInstance) => {
    const updateHeight = () => {
      const contentHeight = Math.min(400, Math.max(minHeight, editorInstance.getContentHeight()));
      setEditorHeight(contentHeight);
      editorInstance.layout();
    };

    editorInstance.onDidContentSizeChange(updateHeight);
    updateHeight();
  };

  // Explanation is not persisted — every click regenerates it from the current editor value
  const handleExplain = async () => {
    if (!explain) return;
    setIsExplaining(true);
    try {
      const result = await explainCode({
        title: explain.title,
        content: value,
        language: language || null,
        typeName: explain.typeName,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setExplained({ text: result.data, source: value });
      setTab("explain");
    } catch {
      toast.error("AI request failed.");
    } finally {
      setIsExplaining(false);
    }
  };

  // An explanation of different code (after an edit save/cancel) is stale, so it is dropped
  const explanation = explained && explained.source === value ? explained.text : null;
  const showExplain = tab === "explain" && explanation !== null;

  return (
    <div className="rounded-md overflow-hidden border border-border">
      {/* macOS-style window bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1e1e1e] border-b border-[#2d2d2d]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          {explanation !== null && (
            <div className="flex items-center gap-0.5 text-xs">
              {(["code", "explain"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tab === t}
                  onClick={() => setTab(t)}
                  className={`${TAB_CLASS} ${tab === t ? "text-white bg-[#3a3a3a]" : "text-[#858585] hover:text-white"}`}
                >
                  {t === "code" ? "Code" : "Explain"}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {language && (
            <span className="text-xs text-[#858585] font-mono">{language}</span>
          )}
          {explain && isPro === true && (
            <button
              onClick={handleExplain}
              disabled={isExplaining || !value.trim()}
              className="cursor-pointer flex items-center gap-1 text-xs text-[#858585] hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Explain code"
              title="Explain code"
              type="button"
            >
              {isExplaining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Explain
            </button>
          )}
          {explain && isPro === false && (
            <span
              className="flex items-center gap-1 text-xs text-[#858585]"
              title="AI features require Pro subscription"
            >
              <Crown className="w-3.5 h-3.5" />
              Explain
            </span>
          )}
          <button
            onClick={() => copy(value)}
            className="cursor-pointer text-[#858585] hover:text-white transition-colors"
            aria-label="Copy code"
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

      {showExplain && (
        <div className="markdown-preview bg-background p-3 overflow-y-auto min-h-20 max-h-[400px]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
        </div>
      )}

      {/* Kept mounted (just hidden) so Monaco keeps its state while the Explain tab is open */}
      <div className={showExplain ? "hidden" : undefined}>
        <Editor
          height={editorHeight}
          value={value}
          language={language || "plaintext"}
          theme={preferences.theme}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          onChange={(val) => onChange?.(val ?? "")}
          options={{
            readOnly,
            domReadOnly: readOnly,
            minimap: { enabled: preferences.minimap },
            scrollBeyondLastLine: false,
            fontSize: preferences.fontSize,
            tabSize: preferences.tabSize,
            lineNumbers: "on",
            wordWrap: preferences.wordWrap ? "on" : "off",
            automaticLayout: true,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              useShadows: false,
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            padding: { top: 12, bottom: 12 },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            renderLineHighlight: readOnly ? "none" : "line",
            contextmenu: false,
            folding: false,
          }}
        />
      </div>
    </div>
  );
}
