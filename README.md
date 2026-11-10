<p align="center">
  <img src="./logo.png" alt="i-have-adhd" width="140" />
</p>
<p align="center">
  <strong>ADHD-friendly outputs. No ADHD diagnosis needed!</strong>
</p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/flyingnobita/i-have-adhd?style=flat" alt="License"></a>
  <a href="https://skills.sh/flyingnobita/i-have-adhd"><img src="https://skills.sh/b/flyingnobita/i-have-adhd" alt="skills.sh"></a>
</p>

# i-have-adhd

A skill for your coding assistant that stops it from burying the answer: action first, steps numbered, no "Hope this helps!" This repository is a standalone fork of [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) by Ayoub G., the original author; the [upstream README](https://github.com/ayghri/i-have-adhd#readme) has the original pitch.

## Why this fork exists

The rules are written for a person reading replies as they arrive. Upstream injects them into every session once the flag file exists, and a worker session in Orca or Herdr looks the same to the hook as a human one.

- Rules 3 and 9 are written for a reader, not a pipeline. One closing next step and a five-item working set suit a person; in a worker report, a handoff, or a commit message they push the model to hold back what the next agent needs.
- Other skills compete with them. A findings table, a question round, or a full report has its own required shape, and rules 2, 3, and 9 pull toward a shorter one. This fork's `SKILL.md` says the other skill wins, but a rule sitting in context still competes with it.
- Orchestration multiplies it. An agent launches workers, each worker's output goes to another agent, and only the reply at the end of the chain reaches a person.

This fork loads the rules only when a human is reading. The skill name, plugin name, and `/i-have-adhd` command are unchanged, and explicit invocation works in any session. [ADR 0001](docs/adr/0001-human-session-gating.md) records the alternatives rejected, including relying on the scope clause alone.

Always-on remains opt-in through each agent's flag file or configuration. The automatic decision is:

| Agent | Human | Non-human | Unclear |
| --- | --- | --- | --- |
| Claude | `CLAUDE_CODE_SESSION_ATTENDED=1` | `CLAUDE_CODE_SESSION_ATTENDED=0` | unset or malformed |
| Codex | parent `codex app-server ... --managed-daemon`, or the interactive TUI's parent `codex` with no subcommand | parent `codex exec` (or `e`) | any other parent |
| Pi | `mode=tui` | `mode=print` or `mode=json` | `mode=rpc` or missing/malformed signals |
| omp | `kind=main` and `mode=tui` | `kind=sub`, `mode=print`, or `mode=json` | main `mode=rpc` or missing/malformed signals |
| OpenCode | top-level session (assumed human) | any `parentID` subagent | the session lookup fails or returns no session, the session ID is missing, or the `parentID` is malformed |

An unclear session does not load the rules and shows only this notice:

```text
i-have-adhd: couldn't tell if a human is reading; rules not loaded. Run /i-have-adhd to turn them on.
```

Decision logging is off by default. Add a line that is exactly `log` to the agent's always-on flag file, or set `I_HAVE_ADHD_LOG=1`, to append one JSON object per decision to `~/.local/state/i-have-adhd/decisions.log`.

### Opt out and worker sessions

`I_HAVE_ADHD=0` overrides every other signal and turns automatic injection off. Set it in a worker's environment so ADHD chat formatting does not shape subagent prompts, orchestrator reports, files, commits, PRs, or handoffs.

- Herdr: run `export I_HAVE_ADHD=0` in the pane first, for example `herdr pane run <pane> "export I_HAVE_ADHD=0"`, then start the agent.
- Orca: set it in the worker's environment if the launcher allows. `worker-start` does not, so those workers rely on the backstop below.
- If detection gets a session wrong, the skill's scope clause tells unattended workers to ignore the rules.

### OpenCode exception

OpenCode has no signal that distinguishes `run` from the TUI. With the always-on flag, top-level sessions are assumed human, while subagents are skipped by querying OpenCode's session API (`client.session.get` in V1, `ctx.session.get` in V2) to inspect `parentID`. If the lookup fails or the session ID is missing, the decision fails closed as unclear (no injection). OpenCode V1 releases with a toast API show an `assumed human` toast after injection; V2 and older V1 releases show none.

## Before and after

<table>
<tr>
<td width="50%">

### Before

> Great question! Let me think about this. Your auth flow has a few moving pieces: the middleware, the token verification, and the cookie handling. Looking at `src/auth.ts`, the `verifyToken` function (around lines 42-58) seems to be using an older `jsonwebtoken` API. One approach would be to update the package and rewrite that function. After making the change, you'd want to run the auth tests to confirm nothing breaks. By the way, you might also want to look at your dependency versions overall. Hope this helps! Let me know if you want to dig deeper.

</td>

<td width="50%">

### After

> Edit `src/auth.ts:42` to update the token validation.
>
> 1. Open `src/auth.ts`
> 2. Replace `verifyToken` (lines 42–58) with the snippet below
> 3. Run `npm test -- auth.spec.ts`
>
> Next: paste the first failing line if any test fails.

</td>
</tr>
</table>

## The rules

10 rules. Full text in [SKILL.md](./skills/i-have-adhd/SKILL.md).

1. Lead with the next action.
2. Number multi-step tasks.
3. End with one concrete next action.
4. Suppress tangents.
5. Restate state every turn.
6. Specific time estimates (minutes, not "a bit").
7. Make wins visible.
8. Matter-of-fact errors.
9. Cap lists to 5 items.
10. No preamble. No recap. No closers.

## Install

Copy/paste into your CLI prompt:

```text
Install the i-have-adhd skill/plugin from https://github.com/flyingnobita/i-have-adhd, refer to the repo's AGENTS.md for instructions.
```

Uninstall upstream first: both use the skill name `i-have-adhd`, and colliding files produce duplicate `/i-have-adhd` commands. Always-on in Claude Code and Codex needs Node.js. [INSTALL.md](INSTALL.md) has the steps for each supported agent, the upstream removal commands, Codex hook trust, flag paths, and updates.

## Credits

Original skill by Ayoub G. ([ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)). Loosely based on *The Adult ADHD Tool Kit* by J. Russell Ramsay and Anthony L. Rostain. Adapted for how an LLM should respond, not how a human should organize their day.

[Kacper Rutkiewicz | AI Made Simple](https://youtu.be/NEl8kPWZP_Y) has made a good breakdown of an earlier version of the skill.

## License

[MIT](LICENSE).
