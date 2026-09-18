import { describe, expect, it } from "vitest";
import {
	AnalyticsJobRolesQuerySchema,
	AnalyticsRangeQuerySchema,
} from "../../src/dtos/analyticsDto";

describe("AnalyticsRangeQuerySchema", () => {
	it("defaults the preset to 30d when no query is supplied", () => {
		const parsed = AnalyticsRangeQuerySchema.parse({});

		expect(parsed).toEqual({ preset: "30d", from: undefined, to: undefined });
	});

	it("normalises empty date strings to undefined", () => {
		const parsed = AnalyticsRangeQuerySchema.parse({
			preset: "7d",
			from: "",
			to: "",
		});

		expect(parsed).toEqual({ preset: "7d", from: undefined, to: undefined });
	});

	it("accepts a valid custom range", () => {
		const parsed = AnalyticsRangeQuerySchema.parse({
			preset: "custom",
			from: "2026-01-01",
			to: "2026-01-31",
		});

		expect(parsed).toEqual({
			preset: "custom",
			from: "2026-01-01",
			to: "2026-01-31",
		});
	});

	it("rejects a custom preset without both dates", () => {
		const result = AnalyticsRangeQuerySchema.safeParse({
			preset: "custom",
			from: "2026-01-01",
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			"A custom preset requires both from and to dates",
		);
	});

	it("rejects a malformed date", () => {
		const result = AnalyticsRangeQuerySchema.safeParse({
			preset: "custom",
			from: "01-01-2026",
			to: "2026-01-31",
		});

		expect(result.success).toBe(false);
	});

	it("rejects a date that is not a real calendar day", () => {
		const result = AnalyticsRangeQuerySchema.safeParse({
			preset: "custom",
			from: "2026-02-30",
			to: "2026-03-31",
		});

		expect(result.success).toBe(false);
	});

	it("rejects a from later than to", () => {
		const result = AnalyticsRangeQuerySchema.safeParse({
			preset: "custom",
			from: "2026-03-01",
			to: "2026-02-01",
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			"from must not be later than to",
		);
	});

	it("rejects a span longer than 366 days", () => {
		const result = AnalyticsRangeQuerySchema.safeParse({
			preset: "custom",
			from: "2026-01-01",
			to: "2027-01-02",
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			"The range must not exceed 366 days",
		);
	});

	it("accepts a span of exactly 366 days", () => {
		const result = AnalyticsRangeQuerySchema.safeParse({
			preset: "custom",
			from: "2026-01-01",
			to: "2027-01-01",
		});

		expect(result.success).toBe(true);
	});

	it("rejects an unknown preset", () => {
		expect(AnalyticsRangeQuerySchema.safeParse({ preset: "12d" }).success).toBe(
			false,
		);
	});
});

describe("AnalyticsJobRolesQuerySchema", () => {
	it("applies pagination, sorting and filter defaults", () => {
		const parsed = AnalyticsJobRolesQuerySchema.parse({});

		expect(parsed).toEqual({
			page: 1,
			pageSize: 10,
			preset: "30d",
			from: undefined,
			to: undefined,
			sortBy: "applications",
			sortOrder: "desc",
			capability: [],
			band: [],
			status: [],
			location: undefined,
			roleName: undefined,
		});
	});

	it("normalises single filter values into arrays", () => {
		const parsed = AnalyticsJobRolesQuerySchema.parse({
			capability: "Engineering",
			band: ["Band 2", "Band 3"],
			status: "Open",
			roleName: "",
		});

		expect(parsed.capability).toEqual(["Engineering"]);
		expect(parsed.band).toEqual(["Band 2", "Band 3"]);
		expect(parsed.status).toEqual(["Open"]);
		expect(parsed.roleName).toBeUndefined();
	});

	it("rejects an unknown sort field", () => {
		expect(
			AnalyticsJobRolesQuerySchema.safeParse({ sortBy: "applicantId" }).success,
		).toBe(false);
	});

	it("applies the range refinements to the table query", () => {
		const result = AnalyticsJobRolesQuerySchema.safeParse({ preset: "custom" });

		expect(result.success).toBe(false);
	});
});
