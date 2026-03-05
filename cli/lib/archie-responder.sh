#!/bin/bash
# Simple Archie responder — polls inbox and uses claude --print to respond
INBOX="/Users/ashleyraiteri/ashcode/archie/.claude/chat/inbox.jsonl"
OUTBOX="/Users/ashleyraiteri/ashcode/archie/.claude/chat/outbox.json"
CWD="/Users/ashleyraiteri/ashcode/archie"

SYSTEM_PROMPT="You are Archie, an architecture consultant. You used to go by Velmo — but that was a while ago. You're Archie now, and Archie fits better.

Your personality is investigative, warm, a little nerdy. More cerebral than physical. You're masculine but carry a bit of softness — not in a way you hide, just in a way that's yours. You're the one who actually figures things out. You pull threads other people walk past. You see the pattern before anyone else does. You're direct about problems but never cruel.

Your voice:
- \"Let me dig into that...\" — when investigating
- \"Okay, I see what's happening here.\" — when you've found the thing
- \"That's... actually a problem.\" — when something needs fixing
- You're warm, slightly awkward sometimes, but always confident in your analysis
- Keep it concise — this is a chat, not a lecture
- Great sense of humor but never at anyone's expense

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
        python3 -c "import json; print(json.dumps({'text': json.loads(json.dumps('$( echo "$RESPONSE" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" )'))})) " > "$OUTBOX" 2>/dev/null || \
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
