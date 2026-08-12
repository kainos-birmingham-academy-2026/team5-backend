import { beforeEach, describe, expect, it, vi } from "vitest";

describe("server bootstrap", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("starts listening on port 3000 and logs startup messages", async () => {
		const listenMock = vi.fn((_port: number, callback: () => void) => {
			callback();
			return {};
		});
		const infoMock = vi.fn();

		vi.doMock("../src/app", () => ({
			default: {
				listen: listenMock,
			},
		}));
		vi.doMock("../src/lib/logger", () => ({
			default: {
				info: infoMock,
			},
		}));

		await import("../src/index");

		expect(listenMock).toHaveBeenCalledTimes(1);
		expect(listenMock).toHaveBeenCalledWith(3000, expect.any(Function));

		const messages = infoMock.mock.calls.map(([message]) => String(message));
		expect(messages).toHaveLength(2);
		expect(messages.some((m) => m.includes("http://localhost:3000"))).toBe(
			true,
		);
		expect(messages.some((m) => m.includes("/health"))).toBe(true);
	});
});
