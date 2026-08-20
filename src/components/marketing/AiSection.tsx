import { Sparkles, Check } from "lucide-react";
import { CodeMockup } from "./CodeMockup";
import { ScrollFadeIn } from "./ScrollFadeIn";

const AI_CHECKLIST = [
  "Auto-tag suggestions for every item",
  "Instant summaries for notes & snippets",
  '"Explain This Code" on demand',
  "Prompt optimizer for sharper results",
];

export function AiSection() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 py-24 lg:grid-cols-2">
      <ScrollFadeIn>
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-400/15 px-3 py-1.5 text-xs font-semibold text-purple-400">
          <Sparkles className="size-3.5" />
          Pro Feature
        </span>
        <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Let AI do the busywork</h2>
        <p className="mb-7 text-muted-foreground">
          DevStash Pro understands your content, so you don&apos;t have to organize it by hand.
        </p>
        <ul>
          {AI_CHECKLIST.map((item, i) => (
            <li
              key={item}
              className={`flex items-center gap-2.5 py-2.5 text-sm ${
                i < AI_CHECKLIST.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <Check className="size-[18px] shrink-0 text-emerald-500" strokeWidth={2.5} />
              {item}
            </li>
          ))}
        </ul>
      </ScrollFadeIn>

      <ScrollFadeIn>
        <CodeMockup />
      </ScrollFadeIn>
    </section>
  );
}
