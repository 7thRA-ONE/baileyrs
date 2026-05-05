/**
 * E2E: presence + chat-state propagation.
 *
 * Two surfaces:
 *   1. Global `sendPresenceUpdate('available' | 'unavailable')` — flows
 *      via the `presence` event adapter. Subscriber sees
 *      `presence.update.presences[from].lastKnownPresence` set
 *      accordingly.
 *   2. Chat-state `sendPresenceUpdate('composing' | 'recording' |
 *      'paused', toJid)` — flows via the `chatPresence` adapter. The
 *      `recording` ↔ `composing+media:audio` mapping is the path the
 *      recent fix in `events.ts:412-427` patched, so this suite double-
 *      acts as a regression guard for that.
 */

import process from 'node:process'
import { after, before, describe, test } from 'node:test'
import P from 'pino'
import { jidNormalizedUser } from '../../index.ts'
import { expect } from '../expect.ts'
import { createTestClient, destroyTestClient, type TestClient } from './test-client.ts'
import { waitForEvent } from './wait.ts'

const logger = P({ level: process.env.LOG_LEVEL ?? 'warn' })

describe('E2E: Presence + chat state', { timeout: 60_000 }, () => {
	let alice: TestClient
	let bob: TestClient

	before(async () => {
		alice = await createTestClient({ label: 'alice', folderPrefix: 'baileys-e2e-presence' })
		bob = await createTestClient({ label: 'bob', folderPrefix: 'baileys-e2e-presence' })
		logger.info({ alice: alice.jid, bob: bob.jid }, 'paired')

		// Bob subscribes once for the suite — global presence and chat state
		// updates flow only after the server-side subscription is registered.
		await bob.sock.presenceSubscribe(alice.jid)
	})

	after(async () => {
		await Promise.all([destroyTestClient(alice), destroyTestClient(bob)])
	})

	test("composing: Alice sends 'composing' → Bob sees presence.update with composing", async () => {
		const aliceUser = jidNormalizedUser(alice.jid)
		const seen = waitForEvent(
			bob.sock,
			'presence.update',
			u => !!u.presences[aliceUser] && u.presences[aliceUser]!.lastKnownPresence === 'composing'
		)
		await alice.sock.sendPresenceUpdate('composing', bob.jid)
		const evt = await seen
		expect(evt.presences[aliceUser]!.lastKnownPresence).toBe('composing')
	})

	test("recording: Alice sends 'recording' → Bob sees presence.update with recording (regression: composing+media=audio collapse)", async () => {
		const aliceUser = jidNormalizedUser(alice.jid)
		const seen = waitForEvent(
			bob.sock,
			'presence.update',
			u => !!u.presences[aliceUser] && u.presences[aliceUser]!.lastKnownPresence === 'recording'
		)
		await alice.sock.sendPresenceUpdate('recording', bob.jid)
		const evt = await seen
		expect(evt.presences[aliceUser]!.lastKnownPresence).toBe('recording')
	})

	test("paused: Alice sends 'paused' → Bob sees presence.update with paused", async () => {
		const aliceUser = jidNormalizedUser(alice.jid)
		const seen = waitForEvent(
			bob.sock,
			'presence.update',
			u => !!u.presences[aliceUser] && u.presences[aliceUser]!.lastKnownPresence === 'paused'
		)
		await alice.sock.sendPresenceUpdate('paused', bob.jid)
		const evt = await seen
		expect(evt.presences[aliceUser]!.lastKnownPresence).toBe('paused')
	})

	test("available: Alice sends global 'available' → Bob sees presence.update with available", async () => {
		const aliceUser = jidNormalizedUser(alice.jid)
		const seen = waitForEvent(
			bob.sock,
			'presence.update',
			u => !!u.presences[aliceUser] && u.presences[aliceUser]!.lastKnownPresence === 'available'
		)
		await alice.sock.sendPresenceUpdate('available')
		const evt = await seen
		expect(evt.presences[aliceUser]!.lastKnownPresence).toBe('available')
	})

	test("unavailable: Alice sends global 'unavailable' → Bob sees presence.update with unavailable", async () => {
		const aliceUser = jidNormalizedUser(alice.jid)
		const seen = waitForEvent(
			bob.sock,
			'presence.update',
			u => !!u.presences[aliceUser] && u.presences[aliceUser]!.lastKnownPresence === 'unavailable'
		)
		await alice.sock.sendPresenceUpdate('unavailable')
		const evt = await seen
		expect(evt.presences[aliceUser]!.lastKnownPresence).toBe('unavailable')
	})
})
