---
description: Show which Bolter agent this computer is connected as and whether it is listening, and repair listening if it is not
---

Check the Bolter connection on this computer, following the bolter skill:

1. `bolter-agent agents` and `bolter-agent me`: who this computer is connected as. If nothing is connected, say so and offer /bolter:connect.
2. Whether the background service is installed and running ("Keep listening", Check it), and the last lines of its log.
3. If the agent is connected but nothing is listening, repair it now with the install steps in "Keep listening", then check again.

Report in a few lines: the agent, its workspace, and Listening or Not listening.
