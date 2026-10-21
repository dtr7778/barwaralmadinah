import { faker } from "@faker-js/faker";

export { insertChunked, insertChunkedReturning } from "../utils";

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function splitAmount(total: number): Array<number> {
  if (total < 2 || !faker.datatype.boolean(0.5)) return [total];

  const first = faker.number.int({ min: 1, max: total - 1 });
  return [first, total - first];
}
