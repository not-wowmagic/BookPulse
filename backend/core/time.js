function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function utcNowIso() {
  return new Date().toISOString();
}

export function toUtcIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValidDate(date)) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return date.toISOString();
}

export function toPhtDisplay(utcValue, timeZone = "Asia/Manila") {
  const date = utcValue instanceof Date ? utcValue : new Date(utcValue);
  if (!isValidDate(date)) {
    throw new Error(`Invalid date value: ${utcValue}`);
  }

  return new Intl.DateTimeFormat("en-PH", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "long",
  }).format(date);
}

export function hoursBetween(olderUtcValue, newerUtcValue = new Date()) {
  const older = olderUtcValue instanceof Date ? olderUtcValue : new Date(olderUtcValue);
  const newer = newerUtcValue instanceof Date ? newerUtcValue : new Date(newerUtcValue);

  if (!isValidDate(older) || !isValidDate(newer)) {
    throw new Error("Invalid date for hoursBetween()");
  }

  return Math.max(0, (newer.getTime() - older.getTime()) / (1000 * 60 * 60));
}
