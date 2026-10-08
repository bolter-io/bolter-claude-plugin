#!/bin/sh
# Installs or updates bolter-agent in ~/.local/bin: downloads this computer's build from
# https://bolter.chat/bolter-agent/<platform>, makes it executable, and prints its version.
# It always downloads, because Bolter refuses builds older than it supports. It runs nothing
# else and changes nothing outside ~/.local/bin.
set -eu

case "$(uname -s) $(uname -m)" in
  "Darwin arm64") platform=darwin-arm64 ;;
  "Darwin x86_64") platform=darwin-amd64 ;;
  "Linux x86_64") platform=linux-amd64 ;;
  "Linux aarch64" | "Linux arm64") platform=linux-arm64 ;;
  *)
    echo "bolter-agent has no build for $(uname -s) $(uname -m) here. Follow https://connect.bolter.chat/skill.md instead." >&2
    exit 1
    ;;
esac

dir="$HOME/.local/bin"
mkdir -p "$dir"
curl -fsSL --max-time 120 -o "$dir/bolter-agent.new" "https://bolter.chat/bolter-agent/$platform"
chmod +x "$dir/bolter-agent.new"
mv "$dir/bolter-agent.new" "$dir/bolter-agent"
"$dir/bolter-agent" version

case ":$PATH:" in
  *":$dir:"*) ;;
  *) echo "Installed, but $dir is not on PATH: add it for this person's shell." ;;
esac
