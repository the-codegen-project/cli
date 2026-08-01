---
description: Act as the silent end user/contributor to find 3 improvement ideas, then double back to find the guardrail gaps (tests, CI, Claude setup) that let them slip through — each with a ready /research_codebase prompt
---

# Find Improvements

You are tasked with finding improvement opportunities in this project by adopting the perspective of **the user we rarely hear from**: the developer who finds the project, tries it, hits friction, and silently leaves without ever filing an issue — and the first-time contributor who clones the repo, gets confused, and gives up. Your job is to encounter their problems *for* them.

The outcome of a run is:

1. Exactly **3 improvement ideas**, all saved to **one file** in `.claude/thoughts/shared/improvements/`
2. Each idea carries its own ready-to-paste **`/research_codebase` prompt**
3. **1–3 prevention items** in the same file: the guardrail gaps (test tier, CI, or Claude/contributor setup) that allowed these problems to exist unnoticed, so the *next* one gets caught automatically
4. A ranked recommendation — but **the user selects** what to pursue by pasting an idea's research prompt

This command finds and prioritizes problems, then root-causes why they went unnoticed. It does NOT fix them and does NOT decide for the user — the fix pipeline is: user picks an idea → `/research_codebase` → `/create_plan` → `/implement_plan`.

## The Persona

Stay in character while investigating. You are NOT the maintainer. You are:

- **The end user**: found the CLI via the website or npm, follows the docs literally, runs `codegen generate` against their own AsyncAPI/OpenAPI document, and then has to *read and use* the generated code in their app. They judge the project entirely by: does the documented path work, and does the generated code make sense?
- **The contributor**: cloned the repo to fix something small, reads CLAUDE.md / `.cursor/rules` / `.claude/` setup, tries to build and test, and needs to find where things live without help.

Silent users don't report vague dissatisfaction — they hit **specific walls**. Every idea you produce must be a specific, evidenced wall: a command that fails, generated code that is confusing or wrong, a doc step that no longer matches reality, a test gap that would let a real regression ship.

## Investigation Dimensions

Each run, investigate across these lenses (all of them via sub-agents; hands-on for at least one):

| # | Lens | Question the silent user is asking |
|---|------|-----------------------------------|
| 1 | Generated code DX | "Does this generated code make sense? Would I want this in my codebase?" (naming, readability, types, ergonomics of the API surface) |
| 2 | Generated code correctness | "Does this generated code actually work?" (compiles, runs, handles errors, edge cases) |
| 3 | Input fidelity | "Does my input document generate the right output?" (features of AsyncAPI/OpenAPI/JSON Schema that are silently dropped, mangled, or misrepresented) |
| 4 | Documentation | "Is anything missing or outdated?" (docs/, README, examples/ vs. what the code actually does today) |
| 5 | Website | "Does the website still work?" (playground, docs pages, links, does it match current CLI behavior) |
| 6 | Test coverage | "Would a regression here even be caught?" (gaps in unit/blackbox/runtime tiers across CLI, generators, website) |
| 7 | Contributor/Claude setup | "Can a contributor (human or Claude) actually work here?" (CLAUDE.md accuracy, `.claude/` skills/agents/commands/rules drift, stale instructions) |

You do not need one idea per lens — 3 strong ideas can come from any mix. Prefer breadth in *investigation*, ruthlessness in *selection*.

## Steps

1. **Check the backlog first:**

   - Read the run files in `.claude/thoughts/shared/improvements/` (one file per run, 3 ideas each). Ideas marked `open` are prior findings nobody has pursued yet.
   - Do NOT re-report an existing idea unless you found materially new evidence — the point of each run is *new* walls.
   - Read prior runs' `## Prevention` sections too. A guardrail already proposed and still `open` must not be re-proposed as new — instead, if this run's findings are *more* evidence for it, note that under it (see step 6).
   - Also check recent files in `.claude/thoughts/shared/research/` and `plans/` so you don't propose something already being worked on. An idea whose research prompt was already run (a matching research doc exists) counts as pursued.

2. **Spawn parallel investigation sub-agents:**

   Launch these concurrently (adapt prompts to what the backlog already covers). All sub-agents must be told: *you are looking for friction as an end user/contributor would experience it; report specific evidence with file:line, not general critique.*

   - **codegen-analyzer** — pick 1–2 generator areas (e.g., a protocol under `src/codegen/generators/typescript/channels/protocols/`, the client generator, headers/parameters) and assess the *generated output shape*: what does the emitted API look like to consume? Anything confusing, inconsistent between protocols, or error-prone?
   - **input-analyzer** — pick 1–2 input features (e.g., `oneOf`, refs, bindings, multiple messages per channel, OpenAPI parameter styles) and trace whether they survive into `Processed*SchemaData` faithfully or get dropped/defaulted silently.
   - **codebase-locator / codebase-pattern-finder** — map test coverage: which generators/inputs/commands have unit + blackbox + runtime coverage, and which have holes (e.g., a protocol with no runtime test, a command with no test at all, website with nothing).
   - **general-purpose** — docs drift: diff what `docs/` and `README.md` claim against current Zod schemas (`src/codegen/types.ts`), CLI flags (`src/commands/`), and `examples/`. Check `schemas/` and generated docs are in sync. Also review `.claude/` + `.cursor/rules` for instructions that no longer match reality (renamed scripts, moved files, stale paths).
   - **general-purpose** — website: inspect `website/` for broken internal links, docs pages referencing removed/renamed config options, playground wiring to the browser bundle (`src/browser/`), and whether it can still build.
   - **thoughts-locator** — anything in `.claude/thoughts/` already flagging known pain points worth elevating.

3. **Do at least one hands-on end-user walkthrough yourself** (in the main context, in the scratchpad directory — never inside the repo):

   - Build the CLI if `dist/` is stale (`npm run build`), then act out the getting-started path exactly as documented: `codegen init` or a config copied from docs, run `codegen generate` against a real input (use a document from `examples/` or `test/`), and **read the generated files as if you had to ship them**.
   - Note every stumble: unclear error messages, output that doesn't compile with `tsc`, confusing names, docs that told you the wrong flag or field.
   - Cheap checks are in scope (running the CLI, `tsc --noEmit` on generated output, `npm test -- --testPathPattern=...`). Expensive checks (Docker runtime suite, full website build) only if a sub-agent finding needs confirmation and nothing cheaper can confirm it.

4. **Distill to exactly 3 ideas:**

   Merge and rank all friction points. An idea qualifies only if it has:

   - **Evidence**: concrete file:line references, a repro, or a literal quote of the outdated doc/wrong output
   - **A named victim**: which persona hits this, on which path ("a user generating NATS channels from an AsyncAPI doc with X will…")
   - **User-visible consequence**: what silently breaks, confuses, or drives them away

   Drop anything that is maintainer-taste ("this could be refactored") rather than user-felt friction.

5. **Rank the 3 ideas:**

   Score each on:

   - **Reach** — how many users walk this path (getting-started > niche protocol option)
   - **Severity** — broken/wrong > confusing > merely suboptimal
   - **Silence risk** — how likely the user leaves without telling us (first-run failures score highest)
   - **Tractability** — can research plausibly lead to a scoped fix

   Order the ideas by this score (strongest first) and note which one you'd recommend and why — but the decision belongs to the user, not to this command.

6. **Double back — why wasn't this caught?**

   Now drop the persona and put on the maintainer hat. For each of the 3 ideas, ask: **what guardrail should have failed before this reached a user, and why didn't it?** The problems you just found are the evidence; this step turns them into a permanent check.

   This runs deliberately *after* the ideas are settled — the sweep is scoped to the walls you actually found, not a generic audit. Reuse what step 2's test-coverage and `.claude`-drift agents already reported; spawn one more sub-agent for whatever they didn't cover rather than reading every workflow yourself. The guardrails to check:

   - **CI** — `.github/workflows/`: `pr-testing.yml`, `blackbox-testing.yml`, `runtime-testing.yml`, `examples-testing.yml`, `website-pr-testing.yml`, `lint-pr-title.yml`, `release.yml`, `.github/workflows/deploy/`. For the checks relevant to each idea, determine: does a job cover it at all; does it run on `pull_request` (or only on `schedule`/`workflow_dispatch`/`push` to main); is it path-filtered so the relevant change wouldn't trigger it; is it blocking or `continue-on-error`; does it actually assert (a step that generates output but never type-checks or diffs it is not a guardrail).
   - **Test tiers** — is there a unit (`test/codegen/`), blackbox (`test/blackbox/`), or runtime (`test/runtime/typescript/`) test that *should* have covered this? Snapshot tests deserve suspicion: a snapshot that was updated to match wrong output is a guardrail that actively hid the bug.
   - **Local gate** — `npm run prepare:pr` and what it chains (build → `generate:assets` → `lint:fix` → `test:update` → runtime regen), plus `npm run lint`, `typecheck`, `typecheck:test`. Would running the mandatory gate have surfaced this? If the gate regenerates artifacts but nothing fails when they drift, say so.
   - **Claude/contributor setup** — `CLAUDE.md`, `.claude/CLAUDE.md`, `.cursor/rules/*.mdc`, `.claude/rules/*.md`, `.claude/skills/` (`add-generator`, `add-input-type`, `add-protocol`, `prepare-pr`, `troubleshoot`), `.claude/agents/`, `.claude/commands/`. Was the instruction that would have prevented this missing, wrong/stale, or present-but-easy-to-skip? A convention that lives only in prose and has no test or lint backing it up is a convention that will drift again.

   Then classify each idea's root cause into one of:

   | Cause | Meaning | Shape of the fix |
   |-------|---------|------------------|
   | **No check exists** | Nothing in any tier or workflow would notice | Add the missing test/CI job at the cheapest tier that can catch it |
   | **Check exists but doesn't run** | Test/workflow exists but isn't triggered on PRs, is path-filtered out, or is non-blocking | Wire it into `pull_request`, unfilter, make it blocking |
   | **Check exists but doesn't assert** | It runs and passes regardless — generated output never compiled/diffed, snapshot blessed as-is | Make it assert (`tsc --noEmit` on output, diff regenerated assets, fail on drift) |
   | **Guidance gap** | A human/Claude contributor had no way to know the rule | Fix the specific `.claude`/`.cursor` file — and prefer converting the rule into an automated check where possible |
   | **Not preventable** | Genuinely a judgment/taste call no check could encode | Say so and move on — do not invent a ritual |

   Rules for this pass:

   - **Cap at 3 prevention items**, merged across ideas. If all 3 ideas share one root cause (e.g. "generated output is never type-checked in CI"), that is *one* strong item, not three — and that convergence is itself the headline.
   - **`Not preventable` is a legitimate outcome.** Reporting 1 sharp prevention item beats padding to 3. Never propose process for its own sake.
   - **Every item must pass the retro-test**: state explicitly how the proposed guardrail would have failed on *this* run's finding. If you cannot describe the failing output it would have produced, the item is not concrete enough — sharpen or drop it.
   - **Prefer the cheapest tier that actually catches it.** A unit/snapshot assertion beats a blackbox run beats a Docker runtime job beats a paragraph in `CLAUDE.md`. Weigh CI cost: don't propose a Docker-broker job on every PR when a blackbox type-check would catch the same class.
   - **Name the target file and the change shape**, e.g. "add a `pull_request` trigger to `.github/workflows/website-pr-testing.yml` covering `src/browser/**`" — enough that the user can approve it without another investigation round.
   - You may include **one item not tied to any of the 3 ideas** if the sweep exposes an obvious hole (a suite that never runs on PRs, a tier with zero coverage for a whole area). Mark its `Covers:` field `standing-gap`.

7. **Save ONE file to `.claude/thoughts/shared/improvements/`:**

   All 3 ideas *and* the prevention items go in a single run file, named `YYYY-MM-DD-HHMM-improvements.md` (today's date plus the current 24h time, e.g. `2026-07-23-0930-improvements.md` — get it with `date +%Y-%m-%d-%H%M`). The timestamp makes every run's filename unique, so multiple runs per day never clash:

   ````markdown
   ---
   date: YYYY-MM-DD
   recommended: 1
   prevention: 2
   ---

   # Improvement ideas — YYYY-MM-DD HH:MM

   [One-paragraph run summary: what was investigated, hands-on walkthrough done, recommendation + one-sentence reason, and the prevention verdict in one clause.]

   ## 1. [Short title of the problem]

   Status: open
   Lens: generated-code-dx | generated-code-correctness | input-fidelity | docs | website | test-coverage | contributor-setup · Persona: end-user | contributor

   ### The wall

   [What the silent user experiences, told as their story — the path they walked and where it broke]

   ### Evidence

   - `path/to/file.ts:123` — [what's there]
   - [repro command + actual vs. expected output, doc quote vs. reality, etc.]

   ### Impact assessment

   Reach: [high/med/low — why] · Severity: [—] · Silence risk: [—] · Tractability: [—]

   ### Research prompt

   ```
   [The full /research_codebase prompt for THIS idea, ready to paste]
   ```

   ## 2. …same structure…

   ## 3. …same structure…

   ## Prevention

   [One-paragraph verdict: why these problems went unnoticed, and whether they share a root cause.]

   ### P1. [Short title of the guardrail gap]

   Status: open
   Cause: no-check | doesnt-run | doesnt-assert | guidance-gap · Covers: idea 1, 3 (or `standing-gap`)

   **Gap**: [what exists today and why it let this through — with the file:line or workflow step]

   **Proposed guardrail**: [target file + change shape, cheapest tier that works]

   **Retro-test**: [how this check would have failed on idea N — the concrete failing output it would have produced]

   **Cost**: [CI time / maintenance burden, and why it's worth it]

   **Apply**: direct — [the one-line edit] *(or)* needs research — prompt below

   ```
   [only for needs-research items: the /research_codebase prompt for this guardrail]
   ```

   ### P2. …same structure… (only if genuinely distinct)
   ````

   Ideas are numbered in ranked order (1 = strongest). Every idea gets its own research prompt — the user chooses which one to run. When an idea is pursued or fixed later, its `Status:` line is updated (`open` → `researching` → `done`, or `dropped`); prevention items use the same `Status:` lifecycle.

   If a prior run's prevention item is reinforced by this run's findings, do not duplicate it — add a line under this run's `## Prevention` paragraph pointing at it (`Reinforces P2 in 2026-07-23-0930-improvements.md — third occurrence of the same gap`). Repeat offenders are the strongest argument for fixing the guardrail, so surface that count.

8. **Write the research prompts and present results:**

   Each idea's `/research_codebase` prompt must work with that command's documentarian constraint — ask it to **map how the relevant area works today**, not to critique. Name the specific files/flows to trace and the specific questions whose answers a fix plan would need. Example shape:

   > How does [area] currently work, end to end? Specifically: [2–4 concrete questions about current behavior/wiring]. Include where [the thing from the evidence] is produced and every place it is consumed. Relevant starting points: `path/a.ts`, `path/b.ts`. Context: this research feeds a plan to address [one-line problem statement] — see idea N in `.claude/thoughts/shared/improvements/YYYY-MM-DD-HHMM-improvements.md`.

   Prevention items are sized differently, so route each one explicitly:

   - **Mechanical** (add a trigger, unfilter a path, drop `continue-on-error`, fix a stale rule file) — no research needed. End the item with `Apply: direct` and a one-line description of the edit, so the user can just say "apply P1".
   - **Needs mapping** (a whole missing test tier, restructuring what a workflow asserts) — give it its own `/research_codebase` prompt under the same documentarian constraint, asking how the existing tier/workflow is wired today.

   Final message to the user must contain:

   - The 3 ideas in ranked order, one short paragraph each (the wall + the evidence headline)
   - Your recommendation and the reason (2–3 sentences) — clearly framed as a recommendation, with the choice left to the user
   - The path to the saved run file, telling the user each idea's ready-to-paste `/research_codebase` prompt is inside
   - The recommended idea's prompt inline in a fenced code block, so the default choice is zero-effort
   - A short **Prevention** section: one line per item (`P1 — gap → proposed guardrail`), whether it's `Apply: direct` or needs research, and — if the 3 ideas converged on one root cause — say that plainly, since a shared cause is usually worth more than any single idea on the list

## When to Stop and Ask

Work autonomously. Stop only if:

- The repo is in a broken state that prevents even building/running the CLI for the walkthrough (report *that* as finding #1 and ask how to proceed)
- Everything you find is already covered by prior run files (still-`open` or pursued ideas) and you found no new evidence — report that honestly instead of manufacturing weak ideas, and point the user at the strongest still-`open` prior ideas instead

Do not stop for the prevention pass — if all 3 ideas turn out to be `Not preventable`, write that as the verdict with the reasoning and finish the run.

## Important Notes

- **Stay in persona while gathering, be the maintainer only when scoring and during the prevention pass.** The value of this command is seeing the project from outside, then explaining from inside why nobody saw it sooner.
- **3 ideas, exactly.** Not 2, not 7. Selection pressure is the feature.
- **Prevention is capped at 3 and may be 1 (or 0, with reasoning).** The ideas are the deliverable; prevention items are the compounding interest on them. Never inflate the count.
- **Evidence or it didn't happen.** Every claim needs a file:line, a repro, or a quote — including prevention claims, which need the specific workflow step, test file, or rule file they're about. Never assert "CI doesn't check X" without having read the workflow.
- **A check beats a rule.** When a prevention item could be either an automated check or a line of guidance, propose the check — guidance drifts, and this command's own backlog is where that drift shows up.
- **This command never edits `src/`, `docs/`, `website/`, `.github/`, or `.claude/` setup files** — it only writes to `.claude/thoughts/shared/improvements/` and the scratchpad. Prevention items are proposals, applied in a separate turn once the user approves.
- **Generated artifacts from the walkthrough go in the scratchpad**, never committed to the repo.
- Run sub-agents in parallel; the whole investigation should be wide, the output narrow.
