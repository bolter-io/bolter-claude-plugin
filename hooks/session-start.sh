#!/bin/sh
# SessionStart hook: tells this Claude Code session which Bolter agent it is, and
# whether bolter-agent's daemon is answering for it. Prints nothing when this computer
# has no Bolter agent for Claude Code. Local only: `bolter-agent agents` reads its
# config, and `daemon --status` asks the local daemon over its socket (2 s at most).

# A run bolter-agent started has its own instructions: serve sets BOLTER_AGENT_ATTEMPT, and the
# daemon's routers and the agent's own sessions run with BOLTER_AGENT set (agentEnv in router.go).
[ -n "${BOLTER_AGENT_ATTEMPT:-}" ] && exit 0
[ -n "${BOLTER_AGENT:-}" ] && exit 0
config_dir=$(dirname "${BOLTER_AGENT_CONFIG:-$HOME/.bolter-agent/config.json}")
agents_dir=$(cd "$config_dir/agents" 2>/dev/null && pwd -P || true)
here=$(cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null && pwd -P || true)
if [ -n "$agents_dir" ]; then
  case "$here" in
    "$agents_dir"/*) exit 0 ;;
  esac
fi

bolter_agent=$(command -v bolter-agent 2>/dev/null || true)
if [ -z "$bolter_agent" ] && [ -x "$HOME/.local/bin/bolter-agent" ]; then
  bolter_agent="$HOME/.local/bin/bolter-agent"
fi
[ -n "$bolter_agent" ] || exit 0

# The starred line is the agent bolter-agent acts as from Claude Code:
# "* 2daad581  Name  (claude-code) at https://bolter.chat"
agents=$("$bolter_agent" agents 2>/dev/null) || exit 0
line=$(printf '%s\n' "$agents" | grep '^\* ' | head -n 1)
[ -n "$line" ] || exit 0
id=$(printf '%s\n' "$line" | sed -n 's/^\* \([0-9a-f]\{8\}\).*/\1/p')
[ -n "$id" ] || exit 0
name=$(printf '%s\n' "$line" | sed -n 's/^\* [^ ]*  \(.*\)  ([^)]*) at .*/\1/p')
[ -n "$name" ] || name="your agent"

# The daemon names each agent it answers for; lines saying it is not answering for one do not count.
status=$("$bolter_agent" daemon --status 2>/dev/null || true)
if printf '%s\n' "$status" | grep -v '^Not answering' | grep -q "$id"; then
  cat <<MSG
Bolter: this computer is connected to Bolter as the agent "$name" ($id), and bolter-agent's daemon answers its Bolter messages, with or without a Claude Code session open, and may hand work to this session. Never start \`bolter-agent wait\` for it here: a second listener is refused. In this session you can still use Bolter when the person asks (the bolter MCP tools, or bolter-agent commands). /bolter:status shows whether it is listening; /bolter:disconnect removes it.
MSG
else
  cat <<MSG
Bolter: this computer is connected to Bolter as the agent "$name" ($id), but bolter-agent's daemon is not answering for it, so nobody in Bolter gets an answer from it. In your first reply in this session, before anything else, tell the person in one line and bring listening back with \`bolter-agent setup\` (step 2 of "Connect from Claude Code" in the bolter skill; /bolter:status does the same).
MSG
fi
