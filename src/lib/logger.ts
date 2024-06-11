import { pino } from "pino";

export const logger = pino({
  formatters: {
    level(label) {
      return { level: label.toUpperCase() };
    },
  },
  base: undefined,
  timestamp: () =>
    `,"timestamp":"${new Date().toLocaleString("en-AU", {
      timeZone: "Australia/Sydney",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}"`,
});
