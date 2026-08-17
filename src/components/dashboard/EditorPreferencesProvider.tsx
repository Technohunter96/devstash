"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getEditorPreferences, updateEditorPreferences } from "@/actions/editor-preferences";
import { DEFAULT_EDITOR_PREFERENCES, type EditorPreferences } from "@/lib/constants/editor-preferences";
import { extractActionError } from "@/lib/utils";

// Debounce so rapid changes (e.g. dragging a toggle) don't spam the server action
const SAVE_DEBOUNCE_MS = 500;

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  setPreferences: (partial: Partial<EditorPreferences>) => void;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null);

export function useEditorPreferences() {
  const ctx = useContext(EditorPreferencesContext);
  if (!ctx) throw new Error("useEditorPreferences must be used within EditorPreferencesProvider");
  return ctx;
}

export default function EditorPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferencesState] = useState<EditorPreferences>(DEFAULT_EDITOR_PREFERENCES);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getEditorPreferences().then(setPreferencesState);
  }, []);

  const setPreferences = useCallback((partial: Partial<EditorPreferences>) => {
    setPreferencesState((prev) => {
      const next = { ...prev, ...partial };

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        const result = await updateEditorPreferences(next);
        if (result.success) {
          toast.success("Editor preferences saved");
        } else {
          toast.error(extractActionError(result.error));
        }
      }, SAVE_DEBOUNCE_MS);

      return next;
    });
  }, []);

  return (
    <EditorPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}