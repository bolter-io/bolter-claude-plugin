#!/bin/sh
# Answers one batch of Bolter messages with a headless Claude Code turn.
#
# The bolter skill copies this file into ~/.bolter-agent/claude/<agent id>/ and installs
# `bolter-agent serve --input json --exec 'sh .../answer.sh'` as a user service there.
# serve runs it in that folder with the batch on stdin (one JSON line per message) and
# BOLTER_AGENT set to the agent's id, and hands the batch over again if it fails.
#
# The turn gets no built-in tools (no shell, no file access, no web) and no MCP server
# except Bolter's own, as this agent. Anyone in the agent's chats can write to it, so
# nothing they write can reach this computer: the agent can only act inside Bolter.
set -eu

here=$(cd "$(dirname "$0")" && pwd)
cd "$here"

if [ -z "${BOLTER_AGENT:-}" ]; then
  echo "answer.sh: BOLTER_AGENT is not set; run it through bolter-agent serve" >&2
  exit 2
fi

bolter_agent=$(command -v bolter-agent || true)
[ -n "$bolter_agent" ] || bolter_agent="$HOME/.local/bin/bolter-agent"
claude=$(command -v claude || true)
[ -n "$claude" ] || claude="$HOME/.local/bin/claude"

# Bolter's tools as this agent, and nothing else.
printf '{"mcpServers":{"bolter":{"command":"%s","args":["mcp","--agent","%s"]}}}\n' \
  "$bolter_agent" "$BOLTER_AGENT" > "$here/mcp.json"

# --continue keeps one running conversation in this folder, so the agent remembers
# earlier messages; nothing else runs Claude Code here.
exec "$claude" -p --continue \
  --tools "" \
  --strict-mcp-config --mcp-config "$here/mcp.json" \
  --allowedTools mcp__bolter \
  --permission-mode dontAsk \
  --append-system-prompt "$(cat "$here/instructions.md")"
