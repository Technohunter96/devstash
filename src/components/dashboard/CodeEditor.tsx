"use client";

import { useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Copy, Check } from "lucide-react";

interface CodeEditorProps {
  value: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

export default function CodeEditor({ value, language, readOnly = false, onChange }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const minHeight = readOnly ? 80 : 400;
  const [editorHeight, setEditorHeight] = useState(minHeight);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
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

  return (
    <div className="rounded-md overflow-hidden border border-border">
      {/* macOS-style window bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1e1e1e] border-b border-[#2d2d2d]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex items-center gap-2.5">
          {language && (
            <span className="text-xs text-[#858585] font-mono">{language}</span>
          )}
          <button
            onClick={handleCopy}
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

      <Editor
        height={editorHeight}
        value={value}
        language={language || "plaintext"}
        theme="vs-dark"
        onMount={handleMount}
        onChange={(val) => onChange?.(val ?? "")}
        options={{
          readOnly,
          domReadOnly: readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
          lineNumbers: "on",
          wordWrap: "on",
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
  );
}
