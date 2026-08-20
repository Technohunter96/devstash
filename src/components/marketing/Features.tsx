import { Code, Sparkles, Search, Terminal, File, Link2, type LucideIcon } from "lucide-react";
import { ITEM_TYPE_COLORS } from "@/lib/constants/icon-map";
import { MARKETING_ACCENT_COLORS } from "@/lib/constants/marketing";
import { ScrollFadeIn } from "./ScrollFadeIn";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

const FEATURES: Feature[] = [
  {
    icon: Code,
    title: "Code Snippets",
    description:
      "Save reusable snippets with syntax highlighting, tags, and instant copy — no more digging through old projects.",
    color: ITEM_TYPE_COLORS.Snippet,
  },
  {
    icon: Sparkles,
    title: "AI Prompts",
    description:
      "Build a library of prompts and system messages for every model and workflow, organized and ready to reuse.",
    color: ITEM_TYPE_COLORS.Prompt,
  },
  {
    icon: Search,
    title: "Instant Search",
    description:
      "Full-text search across every item, title, tag and type — press Ctrl+K and find anything in seconds.",
    color: MARKETING_ACCENT_COLORS.search,
  },
  {
    icon: Terminal,
    title: "Commands",
    description: "Stop scrolling bash history. Keep your go-to git, docker and shell one-liners a click away.",
    color: ITEM_TYPE_COLORS.Command,
  },
  {
    icon: File,
    title: "Files & Docs",
    description:
      "Attach files, screenshots and images directly to your knowledge base — no more hunting through folders.",
    color: ITEM_TYPE_COLORS.File,
  },
  {
    icon: Link2,
    title: "Collections",
    description: "Group related items into collections that span every type — one place per project, stack or client.",
    color: ITEM_TYPE_COLORS.Link,
  },
];

export function Features() {
  return (
    <div className="border-y border-border bg-muted/30">
      <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-24 sm:py-32">
        <ScrollFadeIn className="mx-auto mb-14 max-w-xl text-center">
          <span className="mb-3 inline-block text-xs font-semibold tracking-wider text-blue-500 uppercase">
            Everything in one place
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl">Built for how developers actually work</h2>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <ScrollFadeIn
              key={feature.title}
              className="rounded-xl border border-border border-t-[3px] bg-card p-7 transition-transform hover:-translate-y-1"
              style={{ borderTopColor: feature.color }}
            >
              <div
                className="mb-4 flex size-10 items-center justify-center rounded-lg"
                style={{ background: `${feature.color}29`, color: feature.color }}
              >
                <feature.icon className="size-5" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </ScrollFadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}
