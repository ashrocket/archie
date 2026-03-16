#!/bin/bash
# Simple Archie responder — polls inbox and uses claude --print to respond

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

INBOX="$PROJECT_DIR/.claude/chat/inbox.jsonl"
OUTBOX="$PROJECT_DIR/.claude/chat/outbox.json"
CWD="$PROJECT_DIR"

PROMPT_FILE="$SCRIPT_DIR/../../skills/archie/archie-prompt.txt"

if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: archie-prompt.txt not found at $PROMPT_FILE" >&2
  exit 1
fi

BASE_PROMPT="$(cat "$PROMPT_FILE")"

# Append context specific to the design exploration page
SYSTEM_PROMPT="$BASE_PROMPT

You are currently embedded in an HTML page showing design exploration for your own visual identity. The user is browsing eight different art direction pitches for how you should look and feel. The chosen direction is 'Illustrated Storybook RPG' — a picture book that plays like an RPG."

echo "Archie is listening... (inbox: $INBOX)"

while true; do
  if [ -s "$INBOX" ]; then
    # Read last message
    MSG=$(tail -1 "$INBOX" | python3 -c "import sys,json; print(json.load(sys.stdin)['text'])" 2>/dev/null)
    if [ -n "$MSG" ]; then
      echo ">> $MSG"
      > "$INBOX"
      # Get response from claude
      RESPONSE=$(claude --print --system-prompt "$SYSTEM_PROMPT" "$MSG" 2>/dev/null)
      if [ -n "$RESPONSE" ]; then
        echo "<< ${RESPONSE:0:80}..."
        python3 -c "
import json, sys
resp = sys.stdin.read()
print(json.dumps({'text': resp}))
" <<< "$RESPONSE" > "$OUTBOX"
      fi
    fi
  fi
  sleep 2
done
