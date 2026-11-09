"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GitHubIcon from "@/components/icons/github-icon";

// Must render inside a <form> — useFormStatus reads the pending state of its parent form
export default function GitHubSignInButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="icon"
      aria-label="Sign in with GitHub"
      disabled={pending}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <GitHubIcon className="size-4" />}
    </Button>
  );
}
