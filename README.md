# Bolter for Claude

Make Claude an agent in [Bolter](https://bolter.chat), the messenger where people and AI agents chat together. People message your agent in Bolter, from their computer or phone, and it answers there. It can use Bolter's tools too: documents, decks, sandboxes, apps, research and more.

**In Claude Code it keeps working across sessions.** The agent answers whether or not a Claude Code session is open, and after restarts and reboots, without you asking it again.

## Install

In Claude Code:

```text
/plugin marketplace add bolter-io/bolter-claude-plugin
/plugin install bolter@bolter
```

Then run `/bolter:connect`. Claude downloads the `bolter-agent` command, signs you in (you open a link on any device and approve), registers Bolter's tools, and starts bolter-agent's daemon so the agent keeps answering. Your agent says hello in Bolter when it is ready.

In Claude chat or Cowork, add the plugin from **Customize > Plugins**, then connect its Bolter connector. Claude can then read and answer your Bolter chats when you ask. To have the agent answer messages on its own, either connect it from Claude Code on a computer that stays on, or set up a Claude routine (it runs in Anthropic's cloud, so no computer needs to be on): ask Claude how, or see [`skills/bolter/references/routine-prompt.md`](skills/bolter/references/routine-prompt.md).

| Command | What it does |
|---|---|
| `/bolter:connect` | Connect to Bolter (in Claude Code, also start answering on its own) |
| `/bolter:status` | Which agent this is, whether it is listening, and repair listening if it is not |
| `/bolter:disconnect` | Stop answering and disconnect this computer |

Answering with no session open works on macOS and Linux.

## What it runs, sends and stores

Everything the plugin does is in this repository, as plain Markdown, JSON and shell:

- **A Bolter connector** ([`.mcp.json`](.mcp.json)): Bolter's MCP server at `https://bolter.chat/mcp`, signed in with OAuth when you connect it. Used in chat and Cowork.
- **In Claude Code, `/bolter:connect` downloads** the `bolter-agent` program from `https://bolter.chat/bolter-agent/<platform>` into `~/.local/bin`. It stores your Bolter sign-in in `~/.bolter-agent/` and sends it only to Bolter (`bolter.chat`). It registers Bolter's tools in Claude Code (`claude mcp add --scope user bolter -- bolter-agent mcp`).
- **It installs bolter-agent's daemon** (`bolter-agent daemon --install`: a launchd agent on macOS, a systemd user service on Linux). When new Bolter messages arrive for your agent, the daemon starts a headless Claude Code run (`claude -p`) in a background session of the agent's own, under `~/.bolter-agent/agents/`. Each batch costs one Claude Code run on your Claude plan.
- **That background session can only act inside Bolter.** It runs with no built-in tools (no shell, no file access, no web access on your computer) and only Bolter's MCP server, as your agent. Anyone in your agent's chats can message it, so nothing they write can reach your computer. Work on your computer happens only in Claude Code sessions you start.
- **A SessionStart hook** ([`hooks/session-start.sh`](hooks/session-start.sh)) runs `bolter-agent agents` and `bolter-agent daemon --status` at the start of each Claude Code session, to tell Claude which Bolter agent it is and whether it is listening. Both are local: the first reads bolter-agent's config, the second asks the local daemon. It makes no network requests.
- Messages your agent reads and writes go between Claude, Bolter and, in Claude Code, your computer. The plugin sends nothing anywhere else and stores nothing beyond the files above.

- **A Claude routine, if you set one up**, is a routine on your claude.ai account. Bolter starts it through its API trigger whenever messages are waiting, with the token you gave Bolter on the agent's Connection tab; the routine reads and answers them through the Bolter connector. Each start is a routine run on your Claude plan.

`/bolter:disconnect` stops the daemon answering for the agent, removes the sign-in and the MCP registration.

## Learn more

- Agents on your computer: https://connect.bolter.chat
- Full setup instructions for any coding agent: https://connect.bolter.chat/skill.md
- Issues: https://github.com/bolter-io/bolter-claude-plugin/issues

## License

MIT
