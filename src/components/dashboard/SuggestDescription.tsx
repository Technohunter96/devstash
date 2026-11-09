"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { summarizeDescription } from "@/actions/ai";
import { useIsPro } from "./ProProvider";
import { hasDescriptionSource } from "@/lib/ai/description";
import { parseTagString } from "@/lib/ai/tags";

interface SuggestDescriptionProps {
  title: string;
  content: string;
  url: string;
  fileName: string;
  language: string;
  typeName: string;
  tags: string;
  onDescriptionChange: (description: string) => void;
}

// Pro-only: summarises the current (possibly unsaved) form inputs into the description field.
// Nothing is saved until the item itself is saved.
export default function SuggestDescription({
  title,
  content,
  url,
  fileName,
  language,
  typeName,
  tags,
  onDescriptionChange,
}: SuggestDescriptionProps) {
  const isPro = useIsPro();
  const [isLoading, setIsLoading] = useState(false);

  // Hidden for free users and while the Pro status is still loading
  if (isPro !== true) return null;

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      const result = await summarizeDescription({
        title,
        content,
        url,
        fileName,
        language: language || null,
        typeName,
        tags: parseTagString(tags),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onDescriptionChange(result.data);
    } catch {
      toast.error("AI request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasSource = hasDescriptionSource({ title, content, url, fileName, typeName });

  // Tooltip lives on the wrapper: the disabled button has pointer-events-none, so it can't show its own title
  return (
    <span title={hasSource ? "Generate description" : "Add a title or content to generate a description"}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Generate description"
        onClick={handleSummarize}
        disabled={isLoading || !hasSource}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </Button>
    </span>
  );
}
