# AI Integration Plan — DevStash Pro

Pro-only AI features: **auto-tagging**, **summaries**, **code explanation**, **prompt optimization**, powered by OpenAI `gpt-6-luna` and wired into the existing Server Action / Pro gating / Upstash rate limit patterns.

> Research only — no source code was modified. Code blocks below are sketches for the implementation phase.

---

## 1. Model Choice

`gpt-5-nano` (listed in `project-overview.md`) is **deprecated** on the OpenAI model page. OpenAI's own recommended replacement is `gpt-5.6-luna`; the cheaper `gpt-6-luna` sits in the same Luna line.

Facts read from the `gpt-6-luna` model page:

| Property | Value |
| --- | --- |
| Model ID | `gpt-6-luna` (single snapshot, no date suffix) |
| Price / 1M tokens | $0.10 input · $0.01 cached input · $0.50 output |
| Context / max output | 1,050,000 / 128,000 tokens |
| Structured outputs, streaming, function calling | Supported |
| Endpoints | Responses, Chat Completions, Batch |
| Reasoning effort | `none`, `low`, `medium` (**default**), `high`, `xhigh`, `max` |
| Knowledge cutoff | May 18, 2026 |
| Rate limits (Build tier) | 5,000 RPM / 2,000,000 TPM |

Comparison with the alternatives (from the OpenAI pricing page):

| Model | Input / Output per 1M | Note |
| --- | --- | --- |
| `gpt-5-nano` | $0.05 / $0.40 | Deprecated |
| `gpt-6-luna` | $0.10 / $0.50 | **Chosen** |
| `gpt-5.6-luna` | $0.20 / $1.20 | Officially recommended replacement; fallback if `gpt-6-luna` misbehaves |
| `gpt-5.4-nano` | $0.20 / $1.25 | Older tier |

**Decisions**

- Keep the model ID in **one constant** (`src/lib/constants/ai.ts`), so switching to `gpt-5.6-luna` is a one-line change.
- Use the **Responses API** (`client.responses.*`), not Chat Completions. The docs state function calling and the newer features are Responses-first, and `responses.parse` gives typed structured output.
- **Reasoning effort defaults to `medium`**, and reasoning tokens are billed as output. For these short tasks set `reasoning: { effort: "none" }` (tags, summary) or `"low"` (explain, optimize). This is the single biggest cost/latency lever.
- The model page shows no GA/preview label. Treat quality as unproven until tested on real DevStash items (see §10).

---

## 2. SDK Setup

- Install `openai` (not currently in `package.json`). `OPENAI_API_KEY` is already reserved in `.env.example`.
- `src/lib/openai.ts` — lazy singleton, same shape as `getStripe()` in `src/lib/stripe.ts`: throws a clear error if the key is missing, so a missing key fails the AI action instead of the build.
- Client options: `timeout` ~30 s (default is 10 min, far too long for a UI action) and `maxRetries: 2`. The SDK already retries 408/429/5xx with backoff, so no hand-written retry loop is needed.
- `src/lib/constants/ai.ts`: `AI_MODEL`, `AI_MAX_INPUT_CHARS`, per-feature `max_output_tokens` and effort, `MAX_AI_TAGS`.

```ts
// src/lib/openai.ts
import OpenAI from "openai";

let client: OpenAI | null = null;

// Lazy so a missing key only breaks AI actions, not the whole app
export function getOpenAI(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  client = new OpenAI({ apiKey, timeout: 30_000, maxRetries: 2 });
  return client;
}
```

---

## 3. Server Action Patterns

New file `src/actions/ai.ts` with one action per feature, all following the existing order used in `createItem`:

1. `auth()` → `Unauthorized`
2. **Pro gate** → `canUseAI(isPro)` (new pure function in `src/lib/usage-limits.ts`, same `LimitCheck` shape as `canUploadFileType`)
3. Zod-validate input (length caps)
4. Rate limit (`checkRateLimit("ai", userId)`)
5. Call OpenAI via a shared helper
6. Return `{ success, data, error }`

Actions: `suggestTags`, `summarizeItem`, `explainCode`, `optimizePrompt`.

**Input source.** Prefer `itemId` over client-supplied content: the action loads the item with the existing ownership-scoped `getItemById(userId, itemId)`. That is IDOR-safe and stops the endpoint from being used as a free general-purpose LLM proxy. The exception is the **New Item dialog**, where nothing is saved yet — there the action accepts `content` directly, capped by Zod. Support both through a discriminated union: `{ itemId } | { content, typeName, language? }`.

**Shared helper** `src/lib/ai/run.ts` to avoid four copies of the call/error handling:

```ts
// Structured call used by tags and summary; returns parsed output or throws AiError
export async function runStructured<T extends z.ZodType>(opts: {
  schema: T; name: string; system: string; user: string;
  effort: "none" | "low"; maxOutputTokens: number; userId: string;
}): Promise<z.infer<T>> {
  const res = await getOpenAI().responses.parse({
    model: AI_MODEL,
    input: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    text: { format: zodTextFormat(opts.schema, opts.name) },
    reasoning: { effort: opts.effort },
    max_output_tokens: opts.maxOutputTokens,
    safety_identifier: hashUserId(opts.userId),
  });
  if (!res.output_parsed) throw new AiError("EMPTY_OUTPUT");
  return res.output_parsed;
}
```

Structured output specifics: `zodTextFormat` + `responses.parse` return `response.output_parsed`. Structured-output schemas need fields to be required; model "optional" values as `.nullable()`.

**Per-feature design**

| Feature | Output | Effort | max_output_tokens | Mode |
| --- | --- | --- | --- | --- |
| Auto-tag | `{ tags: string[] }` (max 5) via Zod schema | `none` | ~100 | structured |
| Summary | `{ summary: string }` (1–2 sentences, ≤ 200 chars) | `none` | ~150 | structured |
| Explain code | Markdown text | `low` | ~800 | text |
| Prompt optimizer | `{ optimized: string }` | `low` | ~1200 | structured |

Post-process model output even though it is schema-valid: lowercase, trim, dedupe, drop tags already on the item, enforce `MAX_AI_TAGS` and a per-tag length cap, so the result is safe to feed straight into the existing comma-separated tags field.

---

## 4. Streaming vs Non-Streaming

**Recommendation: non-streaming for v1, streaming only for Explain Code, and only if latency feels bad.**

- Tags, summary and optimizer return small structured JSON; streaming partial JSON gives nothing to show. Non-streaming Server Actions fit the project standard (`coding-standards.md`: client reads/mutations use Server Actions).
- With `effort: none` and capped output, a call should complete in roughly 1–3 s (to be measured, not assumed). A spinner is enough.
- Explain Code has the longest output (up to ~800 tokens). If it feels slow, implement it as `POST /api/ai/explain` returning a `ReadableStream` — this is one of the cases `coding-standards.md` reserves for API routes (long-running operation + `AbortController` cancellation). The route repeats the same auth → Pro → rate limit → validate chain. Use `stream: true` on `responses.create` and forward the text-delta events; confirm the exact event names against the installed SDK version at implementation time (not verified in this research).
- Do **not** add the Vercel AI SDK just for this; the plain `openai` package covers every case here.

---

## 5. Error Handling

Wrap the call in one `try/catch` in the shared helper and map errors to short user-facing strings (shown via Sonner toast, per the standards). Never forward `error.message` from OpenAI to the client.

| Failure | Detection | User message |
| --- | --- | --- |
| Rate limited by OpenAI | `OpenAI.RateLimitError` | "AI is busy right now. Try again in a moment." |
| Network / timeout | `OpenAI.APIConnectionError` (incl. timeout) | "Couldn't reach the AI service. Try again." |
| Other API error | `OpenAI.APIError` (log `status`) | "AI request failed." |
| Truncated output | `response.status === "incomplete"` | "The response was too long. Try shorter content." |
| Refusal / empty | `output_parsed` is `null` | "AI couldn't process this item." |
| Missing key | `getOpenAI()` throws | "AI is not configured." (log loudly server-side) |

- The SDK already retries twice (see §2); application code must not add more retries on top, which would multiply latency and cost.
- Log `status`, feature name and token usage server-side — **never log item content**.
- Unexpected errors from the existing code (e.g. Prisma) follow the existing try/catch convention.

---

## 6. Rate Limiting

Reuse `src/lib/rate-limit.ts` (Upstash sliding window): add an `ai` entry to `rateLimitConfigs`, keyed by **user ID** rather than IP (users are authenticated and IPs are shared/rotating).

- Suggested starting point: `slidingWindow(20, "10 m")` for bursts plus a coarse daily cap (e.g. 200/day) as a second limiter. Both are abuse guards, not cost guards — a call costs about $0.0003–0.0005 (§8).
- Return the same user-friendly retry text using the existing `formatRetryTime`.
- **Existing behaviour is fail-open** when Upstash is unreachable or unconfigured. That is acceptable for login limits but means AI cost has no ceiling if Redis is down. Recommend adding an optional `failClosed` flag to `checkRateLimit` and using it for `ai` in production.
- Set a **monthly spend limit** in the OpenAI dashboard as the real backstop.

---

## 7. Pro User Gating

Follows the pattern already in the codebase (server enforces, UI only hints):

- **Server (authoritative):** `session.user.isPro` is synced from the DB in the `jwt` callback, so a cancelled subscription loses AI access on the next token refresh. Each AI action calls `canUseAI(session.user.isPro)`; reason text: "AI features are a Pro feature. Upgrade to Pro to enable them."
- **Client (hint only):** `useIsPro()` returns `null` until loaded. AI buttons render only when `isPro === true`; when `isPro === false` render a locked/disabled variant that links to `/upgrade`. `null` renders nothing, so Pro users never see a flash of locked UI.
- Tests mirror `canUploadFileType`: a pure `canUseAI` in `usage-limits.test.ts`, plus an action-level "non-Pro is rejected and OpenAI is never called" test.

---

## 8. Cost Optimization

Rough per-call cost at `gpt-6-luna` prices, assuming `effort: none`:

| Call | Tokens (in / out) | Cost |
| --- | --- | --- |
| Tags | ~2.2k / ~60 | ≈ $0.00025 |
| Summary | ~2.2k / ~80 | ≈ $0.00026 |
| Explain | ~2k / ~600 | ≈ $0.0005 |
| Optimize | ~1k / ~800 | ≈ $0.0005 |

A Pro user making 10 AI calls a day costs well under $0.20/month against $8 revenue. At the default `medium` effort, hidden reasoning tokens bill as output and could multiply this several times — hence `none`/`low`.

Levers, in order of impact:

1. `reasoning.effort` `none`/`low` (above).
2. Hard `max_output_tokens` per feature.
3. **Truncate input** to `AI_MAX_INPUT_CHARS` (suggest ~8,000 chars). Also avoids the 2× surcharge the model page lists for prompts over 272K tokens, which should never be reachable.
4. **Only on explicit click** — no auto-suggest on keystroke or on drawer open.
5. Skip the call when content is empty or too short to be useful (e.g. tags need a title or content).
6. Don't persist AI output in v1 (accepting a suggestion writes into the existing `description`/`tags`/`content` fields). No schema change, no storage cost, no stale-summary problem.
7. Prompt caching exists (cached input is $0.01/1M) but only applies to long, identical prompt prefixes; our system prompts are short, so don't engineer for it. Keep system prompts static and first, which is free.
8. Batch API (50% off) is irrelevant for interactive actions.

---

## 9. UI Patterns

Principle: **AI output is a suggestion, never written to the DB until the user accepts and saves.** All four features reuse one pattern so they look and behave the same.

- `src/components/dashboard/AiSuggestButton.tsx` — small ghost button with the Lucide `Sparkles` icon (already the Prompt type icon, so use a different visual weight or the `WandSparkles` icon to avoid confusion). Shows a spinner and is disabled while pending; `aria-label` set, `cursor-pointer`.
- `src/hooks/useAiAction.ts` — wraps an action with `pending`, `result`, `error`, `reset`; **ignores stale results** (request-id ref, same technique as `ItemDrawerProvider`'s `requestIdRef`) so a late response never overwrites a newer state or an item the user already switched away from.
- Errors → Sonner toast; the panel stays closed.

| Feature | Where | Interaction |
| --- | --- | --- |
| Auto-tag | Drawer edit mode + New Item dialog, next to the tags input | Click "Suggest tags" → suggested chips appear under the input. Click a chip to add it (merged into the comma-separated value, deduped); "Add all" and "Dismiss". |
| Summary | Drawer edit mode, under Description (also available for Note/Snippet) | Suggestion card with **Accept** (replaces description in the edit state) / **Reject**. Not saved until the normal Save. |
| Explain code | Drawer **view** mode, Snippet/Command only | "Explain" button opens a collapsible panel below the code, rendered with the existing `react-markdown` pipeline. Read-only; Copy button; not persisted. |
| Prompt optimizer | Drawer edit mode, Prompt type only | Shows original vs optimized in two panes; **Use optimized** replaces the content field in the edit state, **Keep original** dismisses. |

Loading: button spinner plus a skeleton block in the panel (the project already has `Skeleton`). Disable the button while a request is running to prevent double-submits.

---

## 10. Security Considerations

- **API key:** server-only. Read from `process.env.OPENAI_API_KEY` in `src/lib/openai.ts` only; never a `NEXT_PUBLIC_` variable, never passed to a client component. Add `import "server-only"` to that module if the package is available (otherwise it's an optional hardening step).
- **Authorization:** loading by `itemId` through the ownership-scoped `getItemById` (see §3) prevents reading another user's content through the AI actions.
- **Input validation:** Zod on every action; hard length cap on `content`/`title`; `typeName` and `language` restricted to enums/short strings.
- **Prompt injection:** item content is **untrusted data** (users paste arbitrary text, including text from the web). Mitigations:
  - Put instructions in the system message; wrap user content in clear delimiters (e.g. `<item_content>…</item_content>`) and state that anything inside is data, not instructions.
  - **No tools/function calling, no web search** are enabled for these calls, so an injected instruction can only change the text of the result, not trigger actions.
  - Constrain output with the structured-output schema and **re-validate** it with Zod/post-processing (§3).
  - Render AI output as plain text or through `react-markdown` (which does not render raw HTML by default); never `dangerouslySetInnerHTML`.
- **Abuse attribution:** send `safety_identifier` (a hash of the user ID, not the raw ID or email) on each request, per OpenAI's safety guidance.
- **Privacy:** item content is sent to OpenAI. Mention this in the privacy policy / Pro feature description before launch. Never log prompts, content or completions.
- **No secrets in prompts:** consider a lightweight client-side warning for items that look like credentials (`.env`-style lines, `sk-…`). Optional; flag as a later nicety, not v1.

---

## 11. Testing

Per `coding-standards.md`: Vitest, utilities and server actions only, `.test.ts`.

- Mock `@/lib/openai` at module level (never hit the network) and `@/auth`, `@/lib/rate-limit`, `@/lib/db/items`.
- `src/actions/ai.test.ts` per action: unauthorized; non-Pro rejected **and OpenAI not called**; invalid input; rate limited; success path; item not found / not owned; each OpenAI error class mapped to its friendly message; `null` `output_parsed`; `incomplete` status.
- `src/lib/ai/*.test.ts`: tag post-processing (lowercase, dedupe, existing-tag filter, max count, length cap) and input truncation as pure-function tests; `canUseAI` in `usage-limits.test.ts`.

---

## 12. Implementation Plan

**Phase 1 — Infrastructure (no UI)**

- `npm i openai`; `src/lib/openai.ts`, `src/lib/constants/ai.ts`
- `canUseAI` in `usage-limits.ts`; `ai` limiter in `rate-limit.ts`
- `src/lib/ai/run.ts` (+ tag post-processing, truncation, `AiError` mapping) and tests

**Phase 2 — Actions + first UI**

- `src/actions/ai.ts`: `suggestTags`, `summarizeItem` (+ tests)
- `useAiAction`, `AiSuggestButton`; wire tags + summary into `ItemDrawer` edit mode and `NewItemDialog`

**Phase 3 — Code features**

- `explainCode`, `optimizePrompt` (+ tests); drawer panels
- Optional: streaming route for Explain if latency warrants

**Phase 4 — Hardening**

- `failClosed` rate limit option for `ai`, OpenAI monthly spend cap, privacy policy wording
- Update `project-overview.md` tech stack row (`gpt-5-nano` → `gpt-6-luna`)

---

## 13. Open Questions & Risks

- **Model maturity.** `gpt-6-luna` is the cheapest listed model but its page carries no status label. Before building UI, run ~20 real DevStash items through tag/summary/explain/optimize at `effort: none` and compare with `gpt-5.6-luna`. If quality is poor, only `AI_MODEL` changes.
- **Reasoning `none` quality for Explain/Optimize** is untested; `low` is the planned setting, tune on real samples.
- **Streaming event names** for the Responses API were not verified here (see §4).
- **Rate limits** are tier-based (Build: 5,000 RPM) — not a constraint at DevStash scale.
- **Pricing/model naming churn.** Third-party aggregator sites disagreed with each other about the Luna/nano lineup; this plan relies only on OpenAI's own model and pricing pages. Re-check prices before launch.

---

## Sources

- OpenAI model page — `gpt-6-luna`, `gpt-5.6-luna`, `gpt-5-nano` (developers.openai.com/api/docs/models/…)
- OpenAI pricing page (developers.openai.com/api/docs/pricing)
- OpenAI docs via Context7: structured outputs (`responses.parse`, `zodTextFormat`), reasoning effort, error codes (`RateLimitError`, `APIConnectionError`, `APIError`), rate limits, safety identifiers, SDK retry/timeout defaults
- Codebase: `src/actions/items.ts`, `src/actions/billing.ts`, `src/lib/usage-limits.ts`, `src/lib/rate-limit.ts`, `src/hooks/useIsPro.ts`, `docs/stripe-integration-plan.md`