"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { suggestTags } from "@/actions/ai";
import { useIsPro } from "./ProProvider";
import { mergeTag, parseTagString } from "@/lib/ai/tags";

interface SuggestTagsProps {
  title: string;
  content: string;
  language: string;
  typeName: string;
  tags: string;
  onTagsChange: (tags: string) => void;
}

// Pro-only: asks the AI for tags and adds them straight into the tag field.
// The user removes unwanted ones with the X; nothing is saved until the item is saved.
export default function SuggestTags({
  title,
  content,
  language,
  typeName,
  tags,
  onTagsChange,
}: SuggestTagsProps) {
  const isPro = useIsPro();
  const [isLoading, setIsLoading] = useState(false);

  // Hidden for free users and while the Pro status is still loading
  if (isPro !== true) return null;

  const handleSuggest = async () => {
    setIsLoading(true);
    try {
      const result = await suggestTags({
        title,
        content,
        language: language || null,
        typeName,
        existingTags: parseTagString(tags),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.data.length === 0) {
        toast.info("No new tag suggestions");
        return;
      }
      onTagsChange(result.data.reduce(mergeTag, tags));
    } catch {
      toast.error("AI request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const missingTitle = !title.trim();

  // Tooltip lives on the wrapper: the disabled button has pointer-events-none, so it can't show its own title
  return (
    <span title={missingTitle ? "Fill in the title to suggest tags" : "Suggest Tags"}>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={handleSuggest}
        disabled={isLoading || missingTitle}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Sparkles />
        )}
        Suggest tags
      </Button>
    </span>
  );
}
