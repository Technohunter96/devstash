"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditorPreferences } from "@/components/dashboard/EditorPreferencesProvider";
import {
  FONT_SIZE_OPTIONS,
  TAB_SIZE_OPTIONS,
  EDITOR_THEME_OPTIONS,
  type EditorPreferences,
} from "@/lib/constants/editor-preferences";

export default function EditorPreferencesCard() {
  const { preferences, setPreferences } = useEditorPreferences();

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-base font-semibold">Editor Preferences</h2>

      <div className="divide-y divide-border">
        <PreferenceRow label="Font size" description="Text size used in the code editor.">
          <Select
            value={String(preferences.fontSize)}
            onValueChange={(v) => setPreferences({ fontSize: Number(v) })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PreferenceRow>

        <PreferenceRow label="Tab size" description="Number of spaces per indentation level.">
          <Select
            value={String(preferences.tabSize)}
            onValueChange={(v) => setPreferences({ tabSize: Number(v) })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAB_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} spaces
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PreferenceRow>

        <PreferenceRow label="Theme" description="Color theme for the code editor.">
          <Select
            value={preferences.theme}
            onValueChange={(v) => setPreferences({ theme: v as EditorPreferences["theme"] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITOR_THEME_OPTIONS.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PreferenceRow>

        <PreferenceRow label="Word wrap" description="Wrap long lines instead of scrolling horizontally.">
          <Switch
            checked={preferences.wordWrap}
            onCheckedChange={(checked) => setPreferences({ wordWrap: checked })}
          />
        </PreferenceRow>

        <PreferenceRow label="Minimap" description="Show a miniature code overview on the right.">
          <Switch
            checked={preferences.minimap}
            onCheckedChange={(checked) => setPreferences({ minimap: checked })}
          />
        </PreferenceRow>
      </div>
    </Card>
  );
}

function PreferenceRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
