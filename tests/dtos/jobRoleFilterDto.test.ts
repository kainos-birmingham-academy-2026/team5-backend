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
			sortOrder: "asc",
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
			sortOrder: "asc",
		});
	});

	it("accepts every sortable column with an explicit order", () => {
		expect(
			JobRoleFilterQuerySchema.parse({
				sortBy: "capability",
				sortOrder: "desc",
			}),
		).toMatchObject({ sortBy: "capability", sortOrder: "desc" });
	});

	it("treats an empty sortBy as no ordering", () => {
		expect(
			JobRoleFilterQuerySchema.parse({ sortBy: "", sortOrder: "" }),
		).toMatchObject({ sortBy: undefined, sortOrder: "asc" });
	});

	it.each(["salary", "jobRoleId"])("rejects sortBy %s", (sortBy) => {
		expect(JobRoleFilterQuerySchema.safeParse({ sortBy }).success).toBe(false);
	});

	it("rejects an unsupported sort order", () => {
		expect(
			JobRoleFilterQuerySchema.safeParse({
				sortBy: "roleName",
				sortOrder: "sideways",
			}).success,
		).toBe(false);
	});

	it("rejects a non-ISO closing date", () => {
		expect(
			JobRoleFilterQuerySchema.safeParse({ closingDate: "31/12/2027" }).success,
		).toBe(false);
	});
});
