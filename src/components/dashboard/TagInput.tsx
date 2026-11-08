"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mergeTag, parseTagString } from "@/lib/ai/tags";

interface TagInputProps {
  value: string; // comma-separated, same format the forms already use
  onChange: (value: string) => void;
}

// Tags shown as badges with an X inside the field; type + Enter/comma to add
export default function TagInput({ value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const tags = parseTagString(value);

  const commitDraft = () => {
    const tag = draft.trim();
    if (tag) onChange(mergeTag(value, tag));
    setDraft("");
  };

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag).join(", "));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && !draft && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-1 flex-wrap items-center gap-1.5 border border-border rounded-md px-2.5 py-1.5 focus-within:border-primary">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          {tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            className="cursor-pointer rounded p-0.5 hover:bg-background/60"
            onClick={() => removeTag(tag)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        className="flex-1 min-w-24 bg-transparent text-sm outline-none py-0.5"
        placeholder={tags.length === 0 ? "Add a tag and press Enter" : ""}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
      />
    </div>
  );
}
