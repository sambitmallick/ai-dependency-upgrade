# ai-dependency-upgrade — an AI agent fixes a breaking dependency upgrade until green

Companion repo to a [DevOps Autopilot](https://www.youtube.com/@DevOpsAutopilot) episode.

**The setup.** `signupkit` is a small strict-TypeScript validation library (5 tests) written in
idiomatic **zod 3**. Dependabot opened [PR #1](https://github.com/sambitmallick/ai-dependency-upgrade/pull/1):
*bump zod from 3.25.76 to 4.6.5* — a major version. CI (PR-only: build + test) went red with
**11 compiler errors**.

**The agent** ([`agent/agent.py`](agent/agent.py)) is the from-scratch harness from the previous
episode, given more rope: a `run_tests` tool, a 20-step budget, `src/`-only scope — *the tests are the
contract; it may read them, it may not touch them* — and permission to read `node_modules` (the
library's own types). $0: a local model call (`claude -p` with its tools switched off) and free Actions
minutes.

```bash
npm ci
python agent/agent.py            # migrate src/ to zod 4 until build + tests are green
```

**What happened.** On Dependabot's branch it went green in **10 steps** — and the migration is the
idiomatic one: `z.uuid()/z.email()/z.url()`, `z.union([z.ipv4(), z.ipv6()])` for the removed `.ip()`,
`z.enum(Plan)`, a keyed `z.record`, `.prefault()` where the old `.default()` was parsed through a
transform, `z.function({ input, output })`, `ZodError.issues`. Pushed to the PR → CI green → merged.

Two honest findings:

1. **The summary ≠ the diff.** The agent's summary claimed it replaced `.ip()` with `z.ipv4()` only
   ("test data are all IPv4") — the code has the union. On another run the summary claimed `.prefault`
   where the code used `.default`. The harness logs what the agent *did*; the model narrates what it
   *meant*. Review the diff, never the summary.
2. **The breaking changes that compile.** [`probe/compare.js`](probe/compare.js) runs the same inputs
   through zod 3 and zod 4: **13 of 94 verdicts change** with zero compile errors — stricter UUID
   version/variant bits, IPv6 zone IDs rejected, `z.number()` rejecting ±Infinity, `.int()` meaning
   *safe* integer, `datetime()` requiring seconds, `.max()` counting an emoji as one, `.default({})` no
   longer filling inner defaults. [`probe/signups.js`](probe/signups.js) replays yesterday's traffic —
   12 signups whose IDs came from a legacy random-hex generator — through the green upgrade:

   ```
   zod 3 accepted 12/12.  zod 4 accepts 3/12.  The build is green. The tests are green.
   ```

```bash
npm run build && node probe/compare.js && node probe/signups.js   # zod3 alias is a devDependency
```

**The rule.** The compiler shows you the *safe* breaking changes — the loud ones. The dangerous ones
compile. Before you merge a major version, replay yesterday's traffic (a golden corpus). That's the
harness component an upgrade agent is missing — and the next episode.

---
🎬 Full walkthrough: **[DevOps Autopilot](https://www.youtube.com/@DevOpsAutopilot)**
