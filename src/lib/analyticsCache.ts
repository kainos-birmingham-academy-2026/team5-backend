type CacheEntry = {
	value: unknown;
	expiresAt: number;
};

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 100;

/**
 * Per-process only: entries are not shared between instances and are lost on restart.
 */
export class AnalyticsCache {
	private readonly entries = new Map<string, CacheEntry>();

	constructor(
		private readonly ttlMs: number = DEFAULT_TTL_MS,
		private readonly maxEntries: number = DEFAULT_MAX_ENTRIES,
	) {}

	get<T>(key: string): T | undefined {
		const entry = this.entries.get(key);
		if (!entry) {
			return undefined;
		}

		if (entry.expiresAt <= Date.now()) {
			this.entries.delete(key);
			return undefined;
		}

		return entry.value as T;
	}

	set<T>(key: string, value: T): void {
		if (!this.entries.has(key) && this.entries.size >= this.maxEntries) {
			const oldestKey = this.entries.keys().next().value;
			if (oldestKey !== undefined) {
				this.entries.delete(oldestKey);
			}
		}

		this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
	}

	async readThrough<T>(key: string, load: () => Promise<T>): Promise<T> {
		const cached = this.get<T>(key);
		if (cached !== undefined) {
			return cached;
		}

		const value = await load();
		this.set(key, value);
		return value;
	}

	clear(): void {
		this.entries.clear();
	}
}

/** Keys are built from validated query values only, never from raw request input. */
export const buildCacheKey = (
	endpoint: string,
	params: Record<string, unknown>,
): string =>
	`${endpoint}:${JSON.stringify(params, Object.keys(params).sort())}`;
