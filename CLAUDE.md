# Bolter Claude Code plugin

## The rule above all others

**The agent must keep working across sessions.** Every change keeps a connected agent answering Bolter messages through a closed session, a new session, a crash, a logout, a reboot and a token refresh, with nobody re-running connect or asking it to listen again. An agent that looks connected in Bolter but stops answering when a session ends is the failure this plugin exists to prevent. Design and test the cross-session path first: what brings the listener back, and how do we know it did? The same rule binds every agent harness Bolter supports.

## Layout

- `.claude-plugin/plugin.json`: the manifest. Raise `version` on every release; the directory publishes by version.
- `.claude-plugin/marketplace.json`: lets people install from this repo (`/plugin marketplace add bolter-io/bolter-claude-plugin`).
- `.mcp.json`: Bolter's remote MCP server (`https://bolter.chat/mcp`, OAuth), for chat and Cowork. In Claude Code the skill uses the CLI's stdio server (`bolter-agent mcp`) instead, so the session, its tools and the daemon are one connection; the person picks the same agent on the connector's consent page so it is one agent everywhere.
- `skills/bolter/SKILL.md`: which surface you are on, connect from Claude Code, use from chat/Cowork, work in Bolter, disconnect. The commands in `commands/` only point at its sections.
- `hooks/session-start.sh`: plain POSIX sh, local only (`bolter-agent agents`, `bolter-agent daemon --status`), silent inside bolter-agent's own runs (`BOLTER_AGENT_ATTEMPT`, or a cwd under `<config dir>/agents/`).

## Listening belongs to bolter-agent, not this plugin

The plugin owns no listener. Answering with no session open is `bolter-agent daemon` (Bolter repo, `tools/bolter-agent/`), and its successor `bolter-agent setup` when that lands: the plugin installs it and reads its status. Version 0.1.0 ran its own `serve` + script; it was dropped for the daemon (#5782) so there is one listener implementation.

The daemon's Claude background session must keep **no built-in tools** (`--tools ""`, Bolter PR #5821). Anyone in the agent's chats writes to it. Probed 2026-10-07/08: `--allowedTools "Bash(bolter-agent:*)"` let read-only shell, `~/.zshrc` and the web through under a person's `defaultMode: plan`; and `--permission-mode dontAsk` still runs SendMessage (the person's other sessions) and RemoteTrigger (their cloud routines) without a prompt. The README's safety paragraph depends on this: if the daemon ever widens its tools, change the README in the same release.

## Rules

- The source of truth for connecting any agent is the skill Bolter serves at https://connect.bolter.chat/skill.md (`apps/ws-edge/src/services/external-agents/setup-page.ts` in the Bolter repo). Keep this plugin consistent with it, and with `bolter-agent` (`tools/bolter-agent/` there): the service file names the hook checks come from its `service.go`.
- Anthropic's plugin directory checks every version: no credentials in files, no package launchers, no lockfiles, no top-level `bin/`, README discloses everything the plugin runs, downloads and sends. Run `claude plugin validate .` before pushing.
- User-facing text: no em dashes; say "agent on your computer", "workspace", "chat"; never say "duty".
