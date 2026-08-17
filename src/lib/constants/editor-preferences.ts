export interface EditorPreferences {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  theme: "vs-dark" | "monokai" | "github-dark";
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 12,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

export const FONT_SIZE_OPTIONS = [10, 12, 14, 16, 18, 20] as const;
export const TAB_SIZE_OPTIONS = [2, 4, 8] as const;
export const EDITOR_THEME_OPTIONS = [
  { value: "vs-dark", label: "VS Dark" },
  { value: "monokai", label: "Monokai" },
  { value: "github-dark", label: "GitHub Dark" },
] as const;