// Static syntax-highlighted snippet for the AI section — not a real editor instance, just a visual
export function CodeMockup() {
  const kw = "text-purple-400";
  const fn = "text-blue-400";
  const type = "text-emerald-400";
  const varTok = "text-zinc-100";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="flex items-center gap-1.5 border-b border-border bg-card px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f56]" />
        <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="size-2.5 rounded-full bg-[#27c93f]" />
        <span className="ml-1.5 font-mono text-xs text-muted-foreground">useDebounce.ts</span>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[0.8rem] leading-relaxed text-zinc-300">
        <code>
          {"\n"}
          <span className={kw}>function</span> <span className={fn}>useDebounce</span>
          {"<T>("}
          <span className={varTok}>value</span>
          {": T, "}
          <span className={varTok}>delay</span>
          {": "}
          <span className={type}>number</span>
          {") {\n  "}
          <span className={kw}>const</span>
          {" ["}
          <span className={varTok}>debounced</span>
          {", "}
          <span className={varTok}>setDebounced</span>
          {"] = "}
          <span className={fn}>useState</span>
          {"("}
          <span className={varTok}>value</span>
          {");\n\n  "}
          <span className={fn}>useEffect</span>
          {"(() => {\n    "}
          <span className={kw}>const</span>
          {" "}
          <span className={varTok}>timer</span>
          {" = "}
          <span className={fn}>setTimeout</span>
          {"(() =>\n      "}
          <span className={fn}>setDebounced</span>
          {"("}
          <span className={varTok}>value</span>
          {"), "}
          <span className={varTok}>delay</span>
          {");\n    "}
          <span className={kw}>return</span>
          {" () => "}
          <span className={fn}>clearTimeout</span>
          {"("}
          <span className={varTok}>timer</span>
          {");\n  }, ["}
          <span className={varTok}>value</span>
          {", "}
          <span className={varTok}>delay</span>
          {"]);\n\n  "}
          <span className={kw}>return</span>
          {" "}
          <span className={varTok}>debounced</span>
          {";\n}"}
        </code>
      </pre>
      <div className="border-t border-border px-5 py-4">
        <span className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-purple-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
            <path d="M12 3l1.9 4.5L18 9l-4.1 1.5L12 15l-1.9-4.5L6 9l4.1-1.5z" />
          </svg>
          AI Generated Tags
        </span>
        <div className="flex flex-wrap gap-2">
          {["react", "hooks", "debounce", "performance"].map((tag, i) => (
            <span
              key={tag}
              className="animate-[tag-pop_0.4s_ease_forwards] rounded-full border border-purple-400/35 bg-purple-400/15 px-2.5 py-1 text-xs text-purple-400 opacity-0"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}