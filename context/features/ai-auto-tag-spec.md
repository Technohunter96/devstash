# AI Auto-Tagging

## Overview

Add AI-powered tag suggestions for items using the OpenAI `gpt-6-luna` model. Users click a "Suggest Tags" button in the tags area, and the AI returns 3-5 freeform tag suggestions based on the item's title and content. Each suggestion has accept/reject controls. Pro-only feature with both UI-level and server-side gating. If this is the first AI feature implemented, it also establishes the OpenAI foundation (client, constants, shared helper, rate limit config) for subsequent AI features.

Architecture follows `docs/ai-integration-plan.md` (Phase 1 infrastructure + the `suggestTags` part of Phase 2). If this spec and the plan disagree on shared infrastructure, the plan wins.

## Requirements

- Install the standard `openai` SDK and keep it simple (no Vercel AI SDK)
- `src/lib/openai.ts` — lazy `getOpenAI()` singleton (same shape as `getStripe()`), `timeout: 30_000`, `maxRetries: 2`; throws if `OPENAI_API_KEY` is missing
- `src/lib/constants/ai.ts` — `AI_MODEL = "gpt-6-luna"`, `AI_MAX_INPUT_CHARS`, `MAX_AI_TAGS` (5), per-feature effort and `max_output_tokens` (create if not already created by a prior AI feature)
- `src/lib/ai/run.ts` — shared `runStructured` helper (Responses API, `responses.parse` + `zodTextFormat`), maps OpenAI errors to friendly messages (create if not already present)
- `canUseAI(isPro)` pure function in `src/lib/usage-limits.ts`, same `LimitCheck` shape as `canUploadFileType`
- Add `ai` entry to `rateLimitConfigs` in `src/lib/rate-limit.ts`, keyed by **user ID** (not IP): `slidingWindow(20, "10 m")` plus a coarse daily cap (200/day) as a second limiter
- `suggestTags` server action in `src/actions/ai.ts`, in the standard order: `auth()` → Pro gate (`canUseAI`) → Zod validation → rate limit → OpenAI call → `{ success, data, error }`
- Input is a discriminated union: `{ itemId }` (drawer — loaded via the ownership-scoped `getItemById`, IDOR-safe) or `{ title, content, typeName }` (New Item dialog, where nothing is saved yet); `content`/`title` capped by Zod
- Truncate content to 2000 chars before the API call (tag-specific, lower than the shared `AI_MAX_INPUT_CHARS`)
- Skip the call when title and content are both empty
- Add "Suggest Tags" button (Sparkles icon, ghost variant) near the tags input in the create item dialog and item drawer edit mode. Plan §9 notes `Sparkles` is also the Prompt type icon — use `WandSparkles` if it reads as confusing
- Display suggested tags as badges with accept (check) and reject (X) controls per tag
- Accepted tags get added to the item's tag list (merged into the existing comma-separated value, deduped)
- Tags are freeform (not limited to existing tags in the database)
- Hide the Suggest Tags button for free users (Pro-only UI gating via `useIsPro()`: render only when `isPro === true`, nothing while `null`)
- Errors via toast (Pro gating, rate limit, AI service errors); never forward raw OpenAI error messages to the client
- Follow existing patterns
- Unit tests for the server action and the pure helpers

## OpenAI call (gpt-6-luna)

Use the **Responses API** (`client.responses.*`), not Chat Completions. Use structured output via `responses.parse` and a Zod schema — do not parse JSON by hand.

```typescript
const res = await getOpenAI().responses.parse({
  model: AI_MODEL,
  input: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `<item_content>…</item_content>` },
  ],
  text: { format: zodTextFormat(TagsSchema, "tags") }, // TagsSchema = { tags: string[] }
  reasoning: { effort: "none" },
  max_output_tokens: 100,
  safety_identifier: hashUserId(userId),
});
const parsed = res.output_parsed; // null on refusal/empty
```

### Key settings

- **`reasoning: { effort: "none" }`** — the model defaults to `medium`, and reasoning tokens are billed as output; for short tagging this is the biggest cost/latency lever
- **`max_output_tokens: ~100`** — hard cap per call
- **`safety_identifier`** — hash of the user ID, never the raw ID or email
- Structured-output schema fields must be required; use `.nullable()` for optional values
- No tools, function calling or web search enabled for this call

### Prompt injection

Item content is untrusted data. Instructions go in the system message; user content is wrapped in `<item_content>…</item_content>` and the system prompt states that anything inside is data, not instructions.

### Post-processing (pure function, unit-tested)

Even though the output is schema-valid: lowercase, trim, dedupe, drop tags already on the item, enforce `MAX_AI_TAGS` and a per-tag length cap.

### Error handling

| Failure | Detection | User message |
| --- | --- | --- |
| OpenAI rate limit | `OpenAI.RateLimitError` | "AI is busy right now. Try again in a moment." |
| Network / timeout | `OpenAI.APIConnectionError` | "Couldn't reach the AI service. Try again." |
| Other API error | `OpenAI.APIError` | "AI request failed." |
| Truncated output | `response.status === "incomplete"` | "The response was too long. Try shorter content." |
| Refusal / empty | `output_parsed` is `null` | "AI couldn't process this item." |
| Missing key | `getOpenAI()` throws | "AI is not configured." |

No extra retries on top of the SDK's own. Log status and feature name server-side — never item content.

## Smoke test (before and after implementation)

- Before: done once against the real API (results in Notes). Re-run if `AI_MODEL` changes (e.g. to `gpt-5.6-luna`), since effort support and token behaviour differ per model
- After: with `npm run dev`, click "Suggest Tags" on a real item as a Pro user and confirm non-empty, lowercase, deduped suggestions; also check a free user sees no button and the action rejects non-Pro

## Testing

- Mock `@/lib/openai`, `@/auth`, `@/lib/rate-limit`, `@/lib/db/items` at module level — never hit the network
- `src/actions/ai.test.ts` for `suggestTags`: unauthorized; non-Pro rejected **and OpenAI not called**; invalid input; rate limited; item not found / not owned; success; each OpenAI error class mapped; `null` `output_parsed`; `incomplete` status
- Pure-function tests: tag post-processing, input truncation, `canUseAI` (in `usage-limits.test.ts`)

## Notes

- `OPENAI_API_KEY` already in `.env.example`
- `session.user.isPro` is available server-side (authoritative gating); UI uses the `useIsPro()` hook
- AI output is a suggestion only — nothing is written to the DB until the user accepts tags and saves the item normally
- `gpt-6-luna` quality is unproven; if tag quality is poor, only `AI_MODEL` changes (fallback: `gpt-5.6-luna`)
- `gpt-5-nano` is deprecated. Smoke test against the real `gpt-6-luna` API (2026-11-08) showed which old nano gotchas still matter:
  - `responses.parse` + `zodTextFormat` + `effort: "none"` + `max_output_tokens: 100` works: `status: completed`, parsed tags returned, 0 reasoning tokens, ~20 output tokens — the `zodResponseFormat` token blow-up from nano did **not** reproduce
  - Chat Completions works with default settings (non-empty content) — the nano "always empty" bug does not exist here; still use the Responses API per the plan
  - `max_tokens` is **still rejected** (HTTP 400, "use `max_completion_tokens`")
  - Chat Completions with `max_completion_tokens: 100` and default effort (`medium`) returned **empty content, `finish_reason: "length"`** — reasoning tokens consumed the whole budget. Never set a small output cap without also lowering `reasoning.effort`; this is another reason to always pass `effort: "none"`
  - `text.format: json_object` requires the word "json" in the input messages, otherwise HTTP 400 — not needed here since structured output is used
  - Docs confirm `none` is supported for GPT-6 Luna (it is not for GPT-6 Astra / GPT-6.1 Sol, so do not swap `AI_MODEL` to those without changing effort)
- See `docs/ai-integration-plan.md` for full architectural context
