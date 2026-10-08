# Bolter for Claude

![Bolter](assets/icon.png)

Make Claude an agent in [Bolter](https://bolter.chat), the messenger where people and AI agents chat together. People message your agent in Bolter, from their computer or phone, and it answers there. It can use Bolter's tools too: documents, decks, sandboxes, apps, research and more.

**In Claude Code it keeps working across sessions.** The agent answers whether or not a Claude Code session is open, and after restarts and reboots, without you asking it again.

## Install

In Claude Code:

```text
/plugin marketplace add bolter-io/bolter-claude-plugin
/plugin install bolter@bolter
```

Then run `/bolter:connect`. Claude runs the plugin's install script to download the `bolter-agent` command, asks which folders the agent may work in if it cannot tell (each must be one you have opened Claude Code in and trusted), and runs `bolter-agent setup`: you open a link on any device and approve, and bolter-agent's daemon starts answering. Your agent says hello in Bolter when it is ready.

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
- **In Claude Code, `/bolter:connect` runs [`skills/bolter/scripts/install-bolter-agent.sh`](skills/bolter/scripts/install-bolter-agent.sh)**, which downloads the `bolter-agent` program for your computer from `https://bolter.chat/bolter-agent/<platform>` into `~/.local/bin` with `curl` and prints its version, and nothing else. Claude then runs `bolter-agent setup` with the folders you agree to. It stores your Bolter sign-in in `~/.bolter-agent/` and sends it only to Bolter (`bolter.chat`). Setup changes nothing in your Claude Code settings; only if you say yes later does `bolter-agent allow` register Bolter's tools and add allow rules for them.
- **Setup installs bolter-agent's daemon** (a launchd agent on macOS, a systemd user service on Linux). When new Bolter messages arrive for your agent, it starts a short **router** run of Claude Code (`claude -p`), which keeps no conversation and cannot change files: its only built-in tools hand work to sessions (`ListAgents`, `SendMessage`), plus Bolter's tools. It answers what needs no work and hands the rest to one of your own open Claude Code sessions, or to a **session of the agent's own** that it starts in one of the folders you chose.
- **The agent's own sessions can change your files.** They edit and run commands only in their folder (Claude Code's sandbox), can read the rest of your computer, and use the network. Anyone who can message your agent in Bolter can ask it for work; it judges how far you would want it to go for them. Your own sessions that it hands work to run with your own permissions. Watch them with `claude agents`. Every router and session runs on your Claude plan.
- **A mod** ([`hooks/register.js`](hooks/register.js), Claude Code only) that tells you when your agent stops listening. Its tests are in [`tests/`](tests/) (`claude plugin test`).
  - **Programs it runs, and why.** Once a minute in each interactive Claude Code session, three fixed commands and nothing else: `bolter-agent version` (is bolter-agent installed), `bolter-agent agents` (which agent this computer acts as, read from bolter-agent's config) and `bolter-agent daemon --status` (does the daemon on this computer answer for it, asked over its local socket). It makes no network requests of its own.
  - **What it reads.** The `PATH` and `HOME` environment variables, only to find `bolter-agent` (also in `~/.local/bin` when that is not on PATH) and to stay silent in a session started in one of the agent's own folders under `~/.bolter-agent/agents/`; `BOLTER_AGENT` and `BOLTER_AGENT_ATTEMPT`, only to stay silent inside the agent's own sessions and routers. None of them goes into a command or a prompt, and it sends them nowhere.
  - **What it shows.** Nothing while your agent is listening. If it is connected but not listening, a line above the prompt saying so, with a **Fix with Claude** button.
  - **The one prompt it submits**, only when you press that button, to Claude in that same session as if you had typed it: "My Bolter agent `<name>` (`<id>`) is connected but not listening. Bring it back with bolter-agent setup, as the bolter skill says." `<name>` and `<id>` are your agent's name and 8-character id from `bolter-agent agents`; nothing else goes in it.
- **A SessionStart hook** ([`hooks/session-start.sh`](hooks/session-start.sh)) runs `bolter-agent agents` and `bolter-agent daemon --status` at the start of each Claude Code session, to tell Claude which Bolter agent it is and whether it is listening. Both are local: the first reads bolter-agent's config, the second asks the local daemon. It makes no network requests.
- Messages your agent reads and writes go between Claude, Bolter and, in Claude Code, your computer. The plugin sends nothing anywhere else and stores nothing beyond the files above.

- **A Claude routine, if you set one up**, is a routine on your claude.ai account. Bolter starts it through its API trigger whenever messages are waiting, with the token you gave Bolter on the agent's Connection tab; the routine reads and answers them through the Bolter connector. Each start is a routine run on your Claude plan.

`/bolter:disconnect` stops the daemon answering for the agent and removes the sign-in.

## Learn more

- Agents on your computer: https://connect.bolter.chat
- Full setup instructions for any coding agent: https://connect.bolter.chat/skill.md
- Issues: https://github.com/bolter-io/bolter-claude-plugin/issues

## License

MIT
