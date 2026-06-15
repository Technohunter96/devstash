"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewItemDialogContent, type TypeName } from "./NewItemDialog";

interface Props {
  typeName: string;
  color: string;
}

export default function AddTypeItemButton({ typeName, color }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="cursor-pointer shrink-0"
        style={{ borderColor: color + "50", color }}
      >
        <Plus className="size-4" />
        <span className="hidden sm:inline">Add New {typeName}</span>
      </Button>
      <NewItemDialogContent
        open={open}
        onOpenChange={setOpen}
        defaultTypeName={typeName as TypeName}
      />
    </>
  );
}
