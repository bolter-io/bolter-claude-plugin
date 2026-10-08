import { expect, mock, test } from 'claude-code/testing'

// What Claude Code passes to a ui.render hook for the band above the prompt.
const BAND = {
  plugin: 'bolter',
  component: 'AbovePrompt',
  surface: 'terminal',
  viewport: { columns: 120, rows: 40 },
  props: { hasSurvey: false, isWorking: false, maxRows: 6, bodyColumns: 110, scroll: { offset: 0, bodyRows: 6 }, view: {} },
} as const

const AGENTS = '* c2bad229  Plugin test  (claude-code) at https://bolter.chat\n* is who bolter-agent acts as here (claude-code) without --agent.\n'
const LISTENING = 'The daemon is running and answers for: https://bolter.chat#c2bad229\nIts log: x\n'
const REFUSED = 'The daemon is running. Its log: x\nNot answering for c2bad229-aaaa: Bolter refused it (revoked).\n'
const DOWN = 'The daemon is not running for /x/config.json.\n'

/** A computer with bolter-agent on PATH, the agent above connected, and the daemon in the state `daemon` holds. */
function computer(on: any, daemon: { status: string }, cwd = '/Users/p/code') {
  const ran: string[][] = []
  on('session.start', () => ({ cwd }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['drawn by Claude Code'] }))
  on('ui.toast', () => ({ value: undefined }))
  const asked: string[] = []
  on('prompt.submit', ($: unknown, e: { text: string; asUser?: boolean }) => { asked.push(e.text); return { text: e.text } })
  on('process.run', ($: unknown, e: { argv: string[] }) => {
    ran.push(e.argv)
    const args = e.argv.slice(1).join(' ')
    if (args === 'version') return { value: { exitCode: 0, stdout: 'abc\n', stderr: '' } }
    if (args === 'agents') return { value: { exitCode: 0, stdout: AGENTS, stderr: '' } }
    if (args === 'daemon --status') return { value: { exitCode: 0, stdout: daemon.status, stderr: '' } }
    return { deny: 'unexpected command ' + args }
  })
  return { ran, asked }
}

const warning = /is not listening, so nobody in Bolter gets an answer/

test('draws nothing of its own while the agent is listening', async ($, on) => {
  const clock = mock.clock(on)
  computer(on, { status: LISTENING })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/Users/p/code' })
  await clock.settle()
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: warning })).toBeUndefined()
  expect(await ui.find({ key: 'bolter-listen' })).toBeUndefined()
})

test('warns when the daemon is down, and Fix with Claude asks Claude to run setup', async ($, on) => {
  const clock = mock.clock(on)
  const { ran, asked } = computer(on, { status: DOWN })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/Users/p/code' })
  await clock.settle()
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /Bolter: Plugin test is not listening/ })).toBeDefined()
  await ui.press({ key: 'bolter-listen' })
  expect(asked).toEqual(['My Bolter agent Plugin test (c2bad229) is connected but not listening. Bring it back with bolter-agent setup, as the bolter skill says.'])
  // The band never installs anything itself: setup needs the person's say on folders.
  // Every command it runs is fixed text naming bolter-agent, never a computed path.
  expect(ran.every((a) => a[0] === 'bolter-agent')).toBe(true)
  expect(ran.map((a) => a.slice(1).join(' ')).filter((c) => !['version', 'agents', 'daemon --status'].includes(c))).toEqual([])
})

test('a daemon that refuses the agent counts as not listening', async ($, on) => {
  const clock = mock.clock(on)
  computer(on, { status: REFUSED })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/Users/p/code' })
  await clock.settle()
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: warning })).toBeDefined()
})

test('notices within a minute when listening stops', async ($, on) => {
  const clock = mock.clock(on)
  const daemon = { status: LISTENING }
  computer(on, daemon)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/Users/p/code' })
  await clock.settle()
  daemon.status = DOWN
  await clock.advance(60_000)
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: warning })).toBeDefined()
})

test('runs nothing in a claude -p run, such as one of bolter-agent\'s routers', async ($, on) => {
  const clock = mock.clock(on)
  const { ran } = computer(on, { status: DOWN })
  await $.session.start({ surface: null, isInteractive: false, cwd: '/Users/p/code' })
  await clock.advance(120_000)
  expect(ran).toEqual([])
})
