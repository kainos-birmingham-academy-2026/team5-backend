import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsCache, buildCacheKey } from "../../src/lib/analyticsCache";

describe("AnalyticsCache", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns a cached value before the TTL expires", () => {
		const cache = new AnalyticsCache(1000);
		cache.set("key", { total: 5 });

		vi.advanceTimersByTime(999);

		expect(cache.get("key")).toEqual({ total: 5 });
	});

	it("expires a value once the TTL has elapsed", () => {
		const cache = new AnalyticsCache(1000);
		cache.set("key", { total: 5 });

		vi.advanceTimersByTime(1000);

		expect(cache.get("key")).toBeUndefined();
	});

	it("evicts the oldest entry when the cache is full", () => {
		const cache = new AnalyticsCache(1000, 2);
		cache.set("first", 1);
		cache.set("second", 2);
		cache.set("third", 3);

		expect(cache.get("first")).toBeUndefined();
		expect(cache.get("second")).toBe(2);
		expect(cache.get("third")).toBe(3);
	});

	it("does not evict when overwriting an existing key", () => {
		const cache = new AnalyticsCache(1000, 2);
		cache.set("first", 1);
		cache.set("second", 2);
		cache.set("first", 10);

		expect(cache.get("first")).toBe(10);
		expect(cache.get("second")).toBe(2);
	});

	it("loads once and serves subsequent reads from the cache", async () => {
		const cache = new AnalyticsCache(1000);
		const load = vi.fn().mockResolvedValue("value");

		await cache.readThrough("key", load);
		await cache.readThrough("key", load);

		expect(load).toHaveBeenCalledTimes(1);
	});

	it("reloads after the entry expires", async () => {
		const cache = new AnalyticsCache(1000);
		const load = vi.fn().mockResolvedValue("value");

		await cache.readThrough("key", load);
		vi.advanceTimersByTime(1001);
		await cache.readThrough("key", load);

		expect(load).toHaveBeenCalledTimes(2);
	});

	it("clears every entry", () => {
		const cache = new AnalyticsCache(1000);
		cache.set("key", 1);
		cache.clear();

		expect(cache.get("key")).toBeUndefined();
	});
});

describe("buildCacheKey", () => {
	it("builds the same key regardless of parameter order", () => {
		expect(
			buildCacheKey("overview", { to: "2026-01-31", from: "2026-01-01" }),
		).toBe(buildCacheKey("overview", { from: "2026-01-01", to: "2026-01-31" }));
	});

	it("builds different keys for different endpoints", () => {
		expect(buildCacheKey("overview", { preset: "7d" })).not.toBe(
			buildCacheKey("jobRoles", { preset: "7d" }),
		);
	});
});
