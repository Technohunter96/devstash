"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_OPTIONS, PLAINTEXT_LANGUAGE } from "@/lib/constants/languages";

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const current = value || PLAINTEXT_LANGUAGE;
  // Items saved before the dropdown existed may hold a free-form language — keep it selectable
  const isKnown = LANGUAGE_OPTIONS.some((o) => o.value === current);
  const options = isKnown ? LANGUAGE_OPTIONS : [...LANGUAGE_OPTIONS, { value: current, label: current }];

  return (
    // Base UI's <Select.Value> needs `items` to show the label instead of the raw value
    <Select
      items={options}
      value={current}
      onValueChange={(v) => onChange(v === PLAINTEXT_LANGUAGE ? "" : (v as string))}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
