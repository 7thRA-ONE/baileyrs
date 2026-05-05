export type WACallUpdateType = 'offer' | 'ringing' | 'timeout' | 'reject' | 'accept' | 'terminate'

export type WACallEvent = {
	chatId: string
	from: string
	callerPn?: string
	isGroup?: boolean
	groupJid?: string
	id: string
	date: Date
	isVideo?: boolean
	status: WACallUpdateType
	offline: boolean
	latencyMs?: number
	// ── baileyrs additions: bridge surfaces these fields, upstream Baileys
	// today only carries the subset above. Kept optional + named after the
	// bridge fields so consumers using upstream's type don't break.
	callerCountryCode?: string
	deviceClass?: string
	joinable?: boolean
	audio?: string[]
	duration?: number
	audioDuration?: number
	stanzaId?: string
	notify?: string
	platform?: string
	version?: string
}
