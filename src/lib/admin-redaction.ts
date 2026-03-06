const SENSITIVE_KEY_PATTERN =
  /(api[-_ ]?key|secret|token|password|credential|cookie|session|private|refresh|access|authorization|auth)/i;

const FULLY_REDACTED_CONFIG_PATTERN =
  /(system[_-]?prompt|password|secret|token|credential|private[_-]?key)/i;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;

  if (typeof value === "string") {
    return value.length > 120 ? `${value.slice(0, 117)}...` : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    if (depth >= 2) {
      return `[${value.length} items]`;
    }

    const items = value.slice(0, 4).map((entry) => sanitizeValue(entry, depth + 1));
    if (value.length > 4) {
      items.push(`... ${value.length - 4} more`);
    }
    return items;
  }

  if (typeof value === "object") {
    if (depth >= 2) {
      return "[object]";
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitizeValue(entry, depth + 1),
      ]),
    );
  }

  return String(value);
}

export function shouldFullyRedactConfig(key: string) {
  return FULLY_REDACTED_CONFIG_PATTERN.test(key);
}

export function redactAdminValue(value: unknown) {
  return sanitizeValue(value);
}

export function formatAdminPreview(value: unknown, fallback = "Sin datos") {
  if (value == null) return fallback;

  const sanitized = redactAdminValue(value);
  const text =
    typeof sanitized === "string"
      ? sanitized
      : JSON.stringify(sanitized, null, 2);

  return text.length > 320 ? `${text.slice(0, 317)}...` : text;
}

export function summarizeAdminPreview(value: unknown, fallback = "Sin cambios") {
  const preview = formatAdminPreview(value, fallback).replace(/\s+/g, " ").trim();
  return preview.length > 160 ? `${preview.slice(0, 157)}...` : preview;
}
