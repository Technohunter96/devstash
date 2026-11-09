-- Note moved off StickyNote so it no longer looks like the File icon
UPDATE "item_types" SET "icon" = 'NotebookText' WHERE "name" = 'Note' AND "is_system" = true;
