// The Bolter mod: keeps the person told whether their Bolter agent is listening.
//
// The plugin's rule is that a connected agent keeps answering across sessions and
// restarts (README, "In Claude Code it keeps working across sessions"). When it does
// not, nobody in Bolter gets an answer and nothing on this computer says so. This mod
// checks once a minute with two local commands, `bolter-agent agents` (reads its
// config) and `bolter-agent daemon --status` (asks the local daemon over its socket),
// and only when the agent is connected but not listening draws a band above the
// prompt with a button that asks Claude, in this session, to bring listening back with
// `bolter-agent setup` (which asks the person which folders to use when it cannot tell).
// It makes no network requests of its own and draws nothing while all is well.

const CHECK_EVERY_MS = 60_000

// What the last check found: null until it runs, or when this computer has no agent.
let agent = null // { id, name, listening }
let busy = false

// The starred line of `bolter-agent agents` is the agent it acts as from Claude Code:
// "* 2daad581  Name  (claude-code) at https://bolter.chat"
function currentAgent(out) {
  const line = out.split('\n').find((l) => l.startsWith('* '))
  const m = line && /^\* ([0-9a-f]{8})\S*\s{2}(.*?)\s{2}\([^)]*\) at /.exec(line)
  return m ? { id: m[1], name: m[2] || 'your agent' } : null
}

// The daemon lists the agents it answers for; lines saying it is not answering for one do not count.
function daemonAnswersFor(out, id) {
  return out.split('\n').some((l) => !l.startsWith('Not answering') && l.includes(id))
}

// Every command is fixed text. The skill installs bolter-agent in ~/.local/bin, which may not be
// on PATH, so the runs look there after PATH; PATH and HOME are only used to find the program.
async function runOptions($) {
  const path = await $.env.get('PATH')
  const home = await $.env.get('HOME')
  return { env: { PATH: (path ? path + ':' : '') + home + '/.local/bin' }, timeoutMs: 5000 }
}

async function installed($, opts) {
  try {
    await $.process.run(['bolter-agent', 'version'], opts)
    return true
  } catch {
    return false
  }
}

async function check($) {
  const opts = await runOptions($)
  let next = null
  if (await installed($, opts)) {
    try {
      const listed = await $.process.run(['bolter-agent', 'agents'], opts)
      const found = currentAgent(listed.stdout)
      if (found) {
        const status = await $.process.run(['bolter-agent', 'daemon', '--status'], opts)
        next = { ...found, listening: daemonAnswersFor(status.stdout, found.id) }
      }
    } catch {
      next = agent
    }
  }
  const changed = JSON.stringify(next) !== JSON.stringify(agent)
  agent = next
  if (agent && agent.listening) busy = false
  if (changed) $.ui.invalidate('ui.render')
}

// The daemon's routers and the agent's own sessions (BOLTER_AGENT set), and serve's runs, have their own
// instructions and no one to show a band to.
async function insideABolterRun($) {
  if (await $.env.get('BOLTER_AGENT_ATTEMPT')) return true
  if (await $.env.get('BOLTER_AGENT')) return true
  const home = await $.env.get('HOME')
  const cwd = await $.session.cwd()
  return typeof cwd === 'string' && cwd.startsWith(home + '/.bolter-agent/agents/')
}

export function register(on) {
  on('session.start', async ($, e, next) => {
    if (!(await insideABolterRun($))) {
      // Check once now, without holding up the session, then once a minute.
      $.clock.after(0, () => check($))
      $.clock.every(CHECK_EVERY_MS, () => check($))
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!agent || agent.listening) return next(e)
    const { Box, Text, Button } = $.ui.resolve(e)
    // Setup needs the person's say on folders, so Claude does it in this session rather than the band running it.
    const fix = async () => {
      busy = true
      $.ui.invalidate('ui.render')
      await $.prompt.submit({
        text: 'My Bolter agent ' + agent.name + ' (' + agent.id + ') is connected but not listening. Bring it back with bolter-agent setup, as the bolter skill says.',
        asUser: true,
      })
    }
    const theirs = await next(e)
    return Box({
      flexDirection: 'column',
      children: [
        Box({
          flexDirection: 'row',
          columnGap: 2,
          children: [
            Text({ color: 'warning', children: ['Bolter: ' + agent.name + ' is not listening, so nobody in Bolter gets an answer from it.'] }),
            Button({ key: 'bolter-listen', label: busy ? 'Asked Claude' : 'Fix with Claude', onPress: busy ? () => {} : fix }),
          ],
        }),
        theirs,
      ],
    })
  })
}
