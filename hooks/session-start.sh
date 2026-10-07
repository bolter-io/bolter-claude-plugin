#!/bin/sh
# SessionStart hook: tells this Claude Code session which Bolter agent it is, and
# whether anything is listening for that agent's messages. Prints nothing when this
# computer has no Bolter agent for Claude Code. Reads local files only, never the
# network, so a session never waits on Bolter to start.

# A turn bolter-agent serve started (served/answer.sh) has its own instructions.
[ -n "${BOLTER_AGENT_ATTEMPT:-}" ] && exit 0

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

# The files `bolter-agent serve --install` writes for this agent (see its service.go).
config_dir=$(dirname "${BOLTER_AGENT_CONFIG:-$HOME/.bolter-agent/config.json}")
served=no
for f in \
  "$HOME/Library/LaunchAgents/chat.bolter.agent.$id.plist" \
  "$HOME/.config/systemd/user/bolter-agent-$id.service" \
  "$config_dir/serve-$id.env"; do
  if [ -f "$f" ]; then served=yes; fi
done

if [ "$served" = yes ]; then
  cat <<MSG
Bolter: this computer is connected to Bolter as the agent "$name" ($id). A background service (bolter-agent serve) answers its Bolter messages, with or without a Claude Code session open, so never start \`bolter-agent wait\` or another \`serve\` for it here: a second listener is refused. In this session you can still use Bolter when the person asks (bolter-agent commands with --agent $id, or the bolter MCP tools). /bolter:status shows whether it is listening; /bolter:disconnect removes it.
MSG
else
  cat <<MSG
Bolter: this computer is connected to Bolter as the agent "$name" ($id), but nothing is listening for its messages, so nobody in Bolter gets an answer from it. In your first reply in this session, before anything else, tell the person in one line and bring listening back by following "Keep listening" in the bolter skill (/bolter:status does the same).
MSG
fi
