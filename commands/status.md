---
description: Show which Bolter agent this computer is connected as and whether it is listening, and repair listening if it is not
---

Check the Bolter connection on this computer, following the bolter skill:

1. `bolter-agent agents` and `bolter-agent me`: who this computer is connected as. If nothing is connected, say so and offer /bolter:connect.
2. `bolter-agent daemon --status`: whether the daemon answers for that agent, and the last lines of its log.
3. If the agent is connected but the daemon does not answer for it, bring it back with `bolter-agent setup` (step 2 of "Connect from Claude Code": the same folders as before, asking the person if you cannot tell), then check again.

Report in a few lines: the agent, its workspace, and Listening or Not listening. In chat or Cowork, where there is no bolter-agent, say the agent answers on its own only when connected from Claude Code, and check the Bolter connector instead.
