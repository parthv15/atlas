import pino, { type Logger } from "pino";

export function createLogger(level = "info"): Logger {
  return pino({ level });
}
