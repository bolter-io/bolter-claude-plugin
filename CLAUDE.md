# Bolter Claude Code plugin

## The rule above all others

**The agent must keep working across sessions.** Every change keeps a connected agent answering Bolter messages through a closed session, a new session, a crash, a logout, a reboot and a token refresh, with nobody re-running connect or asking it to listen again. An agent that looks connected in Bolter but stops answering when a session ends is the failure this plugin exists to prevent. Design and test the cross-session path first: what brings the listener back, and how do we know it did? The same rule binds every agent harness Bolter supports.

## Layout

- `.claude-plugin/plugin.json`: the manifest. Raise `version` on every release; the directory publishes by version.
- `.claude-plugin/marketplace.json`: lets people install from this repo (`/plugin marketplace add bolter-io/bolter-claude-plugin`).
- `skills/bolter/SKILL.md`: connect, keep listening, work in Bolter, disconnect. The commands in `commands/` only point at its sections.
- `skills/bolter/served/`: what the background service runs for each batch of messages. `answer.sh` starts a headless Claude Code turn with **no built-in tools and only Bolter's MCP server**. Never widen that: anyone in the agent's chats can write to it, so a wider tool set hands them the person's computer. `--allowedTools "Bash(bolter-agent:*)"` is NOT a containment: Claude Code auto-approves read-only shell commands, so it still read `~/.zshrc` and fetched the web in testing (2026-10-07).
- `hooks/session-start.sh`: plain POSIX sh, local files only, no network, silent inside a served turn (`BOLTER_AGENT_ATTEMPT`).

## Rules

- The source of truth for connecting any agent is the skill Bolter serves at https://connect.bolter.chat/skill.md (`apps/ws-edge/src/services/external-agents/setup-page.ts` in the Bolter repo). Keep this plugin consistent with it, and with `bolter-agent` (`tools/bolter-agent/` there): the service file names the hook checks come from its `service.go`.
- Anthropic's plugin directory checks every version: no credentials in files, no package launchers, no lockfiles, no top-level `bin/`, README discloses everything the plugin runs, downloads and sends. Run `claude plugin validate .` before pushing.
- User-facing text: no em dashes; say "agent on your computer", "workspace", "chat"; never say "duty".
