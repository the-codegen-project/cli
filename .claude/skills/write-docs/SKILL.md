---
name: write-docs
description: Write or review user-facing documentation in docs/ so it reads for the user rather than as a record of the work that produced it
---

# Write user-facing documentation

Use this whenever you add or edit anything under `docs/`, a protocol or
generator page, an `examples/*/README.md`, or the root `README.md`.

## The failure this exists to prevent

Docs written at the end of an implementation session tend to preserve the
*conversation* rather than serve the reader. The tell is a section that answers
a question the reader never asked, but a reviewer did: why the scope was drawn
where it was, what was considered and rejected, what the author decided not to
build.

Real example. `docs/protocols/http_server.md` shipped with:

```md
## Explicit non-goals

- **No frameworks other than Express**, and no framework-agnostic core layer.
- **No listener or server construction.**
```

Three things are wrong with it. The support table two screens up already said
`Frameworks other than Express ❌`, so it is duplication. "No framework-agnostic
core layer" describes the shape of the *implementation*, which no user can act
on. And "non-goal" claims a permanent intent the project has not committed to —
multiple frameworks are a plausible future feature, and the docs should not
foreclose it.

None of the other protocol pages have such a section. It existed because it was
in the PR description.

## Capability tables answer "can I do X?"

Every row names a feature a reader might come looking for, answered `✅` / `❌`
(with a short parenthetical when `❌` needs a pointer). See the table in
`docs/protocols/http_client.md`: `Download ❌`, `XML Based API ❌`,
`Bearer Authentication ✅`.

Never phrase a row in negative space. `| Frameworks other than Express | ❌ |`
is not a feature anyone searches for, and it makes the reader reconstruct the
positive fact. When the answer is a choice rather than a yes/no, put the value
in the cell:

| Instead of | Write |
|---|---|
| `\| Frameworks other than Express \| ❌ \|` | `\| Frameworks \| Express \|` |
| `\| Protocols besides MQTT v5 \| ❌ \|` | `\| Protocol version \| MQTT v5 \|` |

And do not repeat a table row in prose further down — pick one home for the fact.

## Write for someone with a task

Every heading should name something the reader is trying to do or understand:
`Authentication`, `Base URL`, `Error handling`, `Path parameters`,
`Multi-status responses`. `docs/protocols/http_client.md` is the model — read it
before writing a new protocol page.

State what the code does, and what the reader should do about it. If a
limitation matters, say what happens and what to do instead — the reader needs
the behaviour, not the reasoning that produced it.

## Rewrites

| Instead of | Write |
|---|---|
| "Explicit non-goals" / "Out of scope" / "Deliberate omissions" | Nothing — the support table already carries `❌` rows. If a `❌` needs elaboration, put it in the table cell: `❌ (compose your own middleware)` |
| "There is no `basePath` option because none is needed" | "Mounting under a prefix needs no extra configuration" |
| "`response` and `next` are deliberately not handed over: passing them would make the contract ambiguous" | "The callback's return value is the response. Reach for `request` when you need something unmodelled" |
| "The Ajv validator is compiled once, outside the route handler" | "Validation costs no per-request compilation" |
| "This was chosen over X because Y" | Delete. Design rationale belongs in the PR description or `.claude/thoughts/`, not `docs/` |
| "Known limitation" as a trailing section | Fold into the task-shaped section it affects, under a heading naming the situation ("Multiple response bodies") |

## Before you finish

- Does every `##` name a reader task, not a project decision?
- Does anything appear twice — once in the support table, once in prose?
- Would a sentence make sense to someone who never saw the PR? If it only makes
  sense as an answer to a reviewer, cut it.
- Does it claim permanent intent ("never", "non-goal", "will not support") about
  something that is merely unbuilt? Say what is supported today instead.
- Are the code samples real generator output? Never write them from memory —
  run the CLI, or copy from `examples/` or `test/runtime/typescript/src/`.
- New page under `docs/protocols/`? Add it to the protocol lists in `README.md`,
  `docs/README.md`, `docs/getting-started/protocols.md`,
  `docs/generators/channels.md` and `docs/generators/README.md` — and run
  `npm test -- --testPathPattern=protocol-surfaces`, which checks exactly that.
