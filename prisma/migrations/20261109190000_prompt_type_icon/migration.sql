-- Prompt moved off Sparkles so it no longer clashes with the AI buttons
UPDATE "item_types" SET "icon" = 'Bot' WHERE "name" = 'Prompt' AND "is_system" = true;
