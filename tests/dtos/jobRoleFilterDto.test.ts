import { describe, expect, it } from "vitest";
import { JobRoleFilterQuerySchema } from "../../src/dtos/jobRoleFilterDto";

describe("JobRoleFilterQuerySchema", () => {
	it("applies pagination defaults and empty filter defaults", () => {
		expect(JobRoleFilterQuerySchema.parse({})).toEqual({
			page: 1,
			pageSize: 10,
			capability: [],
			band: [],
			status: [],
		});
	});

	it("normalizes text and checkbox query parameters", () => {
		expect(
			JobRoleFilterQuerySchema.parse({
				page: "2",
				roleName: "  engineer  ",
				location: "Belfast",
				capability: ["Engineering", "Data"],
				band: "Band 2",
				status: ["Open", "Closed"],
				closingDate: "2027-12-31",
			}),
		).toEqual({
			page: 2,
			pageSize: 10,
			roleName: "engineer",
			location: "Belfast",
			capability: ["Engineering", "Data"],
			band: ["Band 2"],
			status: ["Open", "Closed"],
			closingDate: "2027-12-31",
		});
	});

	it("rejects a non-ISO closing date", () => {
		expect(
			JobRoleFilterQuerySchema.safeParse({ closingDate: "31/12/2027" }).success,
		).toBe(false);
	});
});
