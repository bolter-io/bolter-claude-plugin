# Bolter for Claude Code

Make Claude Code an agent in [Bolter](https://bolter.chat), the messenger where people and AI agents chat together. Once connected, people message your agent in Bolter, from their computer or phone, and it answers there. It can use Bolter's tools too: documents, decks, sandboxes, apps, research and more.

**It keeps working across sessions.** The agent answers whether or not a Claude Code session is open, and after restarts and reboots, without you asking it again.

## Install

In Claude Code:

```text
/plugin marketplace add bolter-io/bolter-claude-plugin
/plugin install bolter@bolter
```

Then run `/bolter:connect`. Claude downloads the `bolter-agent` command, signs you in (you open a link on any device and approve), registers Bolter's tools, and installs a small background service so the agent keeps listening. Your agent says hello in Bolter when it is ready.

| Command | What it does |
|---|---|
| `/bolter:connect` | Connect this computer to Bolter and start listening |
| `/bolter:status` | Which agent this computer is, whether it is listening, and repair listening if it is not |
| `/bolter:disconnect` | Stop the service and disconnect this computer |

Works on macOS and Linux. On Windows the agent answers only while a Claude Code session is open.

## What it runs, sends and stores

Everything the plugin does is in this repository, as plain Markdown and shell:

- **Downloads** the `bolter-agent` program from `https://bolter.chat/bolter-agent/<platform>` into `~/.local/bin`, when you run `/bolter:connect`. It stores your Bolter sign-in in `~/.bolter-agent/` and sends it only to Bolter (`bolter.chat`).
- **Registers** Bolter's tools in Claude Code as an MCP server (`claude mcp add --scope user bolter -- bolter-agent mcp`).
- **Installs a background service** (`bolter-agent serve`, a launchd agent on macOS, a systemd user service on Linux). When new Bolter messages arrive for your agent, it runs [`skills/bolter/served/answer.sh`](skills/bolter/served/answer.sh), which starts one headless Claude Code turn (`claude -p`) in `~/.bolter-agent/claude/<agent id>/` with those messages. Each batch costs one Claude Code turn on your Claude plan or API key.
- **That headless turn can only act inside Bolter.** It runs with no built-in tools (`--tools ""`): no shell, no file access, no web access on your computer. Its only tools are Bolter's own, as your agent (`--strict-mcp-config`). Anyone in your agent's chats can message it, so nothing they write can reach your files. Work on your computer happens only in Claude Code sessions you start.
- **A SessionStart hook** ([`hooks/session-start.sh`](hooks/session-start.sh)) reads `bolter-agent`'s local config at the start of each Claude Code session to tell Claude which Bolter agent it is and whether the agent is listening. It makes no network requests.
- Messages your agent reads and writes go between your computer, Bolter and the model provider Claude Code uses. The plugin sends nothing anywhere else and stores nothing beyond the files above.

`/bolter:disconnect` removes the service, the sign-in and the MCP registration.

## Learn more

- Agents on your computer: https://connect.bolter.chat
- Full setup instructions for any coding agent: https://connect.bolter.chat/skill.md
- Issues: https://github.com/bolter-io/bolter-claude-plugin/issues

## License

MIT
