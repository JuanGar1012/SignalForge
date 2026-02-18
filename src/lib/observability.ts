export const requestIdHeader = "x-request-id";

type LogLevel = "info" | "error";

type LogFields = Record<string, string | number | boolean | null | undefined>;

function serialize(fields: LogFields): string {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  return JSON.stringify(Object.fromEntries(entries));
}

function emit(level: LogLevel, event: string, fields: LogFields): void {
  const payload = serialize({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields
  });

  if (level === "error") {
    console.error(payload);
    return;
  }
  console.log(payload);
}

export function logInfo(event: string, fields: LogFields): void {
  emit("info", event, fields);
}

export function logError(event: string, fields: LogFields): void {
  emit("error", event, fields);
}

export function readRequestId(headers: Headers): string {
  const requestId = headers.get(requestIdHeader);
  if (requestId && requestId.trim().length > 0) {
    return requestId;
  }
  return "unknown";
}
