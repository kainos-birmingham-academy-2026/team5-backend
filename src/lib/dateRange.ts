const MS_PER_DAY = 86_400_000;

export const toUtcDate = (isoDate: string): Date =>
	new Date(`${isoDate}T00:00:00.000Z`);

export const toIsoDate = (date: Date): string =>
	date.toISOString().slice(0, 10);

export const todayIsoDate = (): string => toIsoDate(new Date());

export const addDays = (isoDate: string, days: number): string =>
	toIsoDate(new Date(toUtcDate(isoDate).getTime() + days * MS_PER_DAY));

export const isCalendarDate = (value: string): boolean => {
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && toIsoDate(parsed) === value;
};

/** Inclusive, so a from equal to to spans one day. */
export const inclusiveDaySpan = (from: string, to: string): number =>
	Math.round(
		(toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY,
	) + 1;

export const daysBetween = (from: string, to: string): number =>
	Math.round(
		(toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY,
	);

/** Monday of the week containing isoDate. */
export const startOfIsoWeek = (isoDate: string): string => {
	const dayOfWeek = toUtcDate(isoDate).getUTCDay();
	return addDays(isoDate, -((dayOfWeek + 6) % 7));
};

/** `to` is inclusive, so the window runs up to the start of the following day. */
export const toDateWindow = (
	from: string,
	to: string,
): { gte: Date; lt: Date } => ({
	gte: toUtcDate(from),
	lt: toUtcDate(addDays(to, 1)),
});
