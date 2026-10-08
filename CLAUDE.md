# Bolter Claude Code plugin

## The rule above all others

**The agent must keep working across sessions.** Every change keeps a connected agent answering Bolter messages through a closed session, a new session, a crash, a logout, a reboot and a token refresh, with nobody re-running connect or asking it to listen again. An agent that looks connected in Bolter but stops answering when a session ends is the failure this plugin exists to prevent. Design and test the cross-session path first: what brings the listener back, and how do we know it did? The same rule binds every agent harness Bolter supports.

## Layout

- `.claude-plugin/plugin.json`: the manifest. Raise `version` on every release; the directory publishes by version.
- `.claude-plugin/marketplace.json`: lets people install from this repo (`/plugin marketplace add bolter-io/bolter-claude-plugin`).
- `.mcp.json`: Bolter's remote MCP server (`https://bolter.chat/mcp`, OAuth), for chat and Cowork. In Claude Code the skill uses the CLI's stdio server (`bolter-agent mcp`) instead, so the session, its tools and the daemon are one connection; the person picks the same agent on the connector's consent page so it is one agent everywhere.
- `skills/bolter/SKILL.md`: which surface you are on, connect from Claude Code, use from chat/Cowork, work in Bolter, disconnect. The commands in `commands/` only point at its sections.
- `hooks/register.js` (named by `modules` in `hooks/hooks.json`): the mod. Draws a band above the prompt only when the agent is connected but not listening, with a Start listening button. Local commands only, through `$.process.run`; silent in the daemon's own runs. Tests: `claude plugin test` (`tests/`). Keep its `claude plugin validate` `calls:` list short: reviewers read it.
- `hooks/session-start.sh`: plain POSIX sh, local only (`bolter-agent agents`, `bolter-agent daemon --status`), silent inside bolter-agent's own runs (`BOLTER_AGENT` or `BOLTER_AGENT_ATTEMPT` set, or a cwd under `<config dir>/agents/`).

## Listening belongs to bolter-agent, not this plugin

The plugin owns no listener. Answering with no session open is `bolter-agent setup` (Bolter repo, `tools/bolter-agent/`, #5851): the daemon starts a router run per batch, which hands work to the person's own sessions or to sessions of the agent's own in the folders setup was given. The plugin runs setup and reads `daemon --status`. 0.1.0 ran its own `serve` + script; 0.2.0 to 0.4.0 wrapped `daemon --install`, which #5851 removed.

What the agent can do on the person's computer is bolter-agent's design (routers: `ListAgents,SendMessage` + Bolter's tools; workers: edit and run in their folder, read anywhere, network on). The README's "What it runs" section must describe it exactly: re-read `router.go` and `workers.go` (`routerTools`, `claudeWorkerTools`) on every release and change the README in the same release if they changed. Probed 2026-10-07/08: a `Bash(bolter-agent:*)` allowlist is not a containment, and `dontAsk` alone still runs SendMessage and RemoteTrigger.

## Rules

- The source of truth for connecting any agent is the skill Bolter serves at https://connect.bolter.chat/skill.md (`apps/ws-edge/src/services/external-agents/setup-page.ts` in the Bolter repo). Keep this plugin consistent with it, and with `bolter-agent` (`tools/bolter-agent/` there): the service file names the hook checks come from its `service.go`.
- Anthropic's plugin directory checks every version: no credentials in files, no package launchers, no lockfiles, no top-level `bin/`, README discloses everything the plugin runs, downloads and sends. Run `claude plugin validate .` before pushing.
- User-facing text: no em dashes; say "agent on your computer", "workspace", "chat"; never say "duty".
