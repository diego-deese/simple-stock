/**
 * Helpers para manejar fechas almacenadas en SQLite.
 *
 * SQLite guarda `CURRENT_TIMESTAMP` en UTC (p.ej. "2026-03-14 12:00:00")
 * y ese string no incluye información de zona horaria.
 *
 * Para mostrar fechas correctamente en la zona local del dispositivo,
 * debemos parsear el valor como UTC y luego formatearlo en local.
 */

export function parseSqliteUtc(dateString: string): Date {
  if (!dateString) {
    return new Date(NaN);
  }

  const trimmed = dateString.trim();

  // Si ya tiene offset / zona (ej. endsWith('Z') o +00:00) lo dejamos.
  if (/[Zz]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  // SQLite CURRENT_TIMESTAMP produce "YYYY-MM-DD HH:MM:SS" (sin la T y sin zona)
  // Convertimos a ISO agregando la 'T' y la 'Z' para forzar UTC.
  const sqliteUtcPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (sqliteUtcPattern.test(trimmed)) {
    return new Date(trimmed.replace(' ', 'T') + 'Z');
  }

  // Fallback genérico.
  return new Date(trimmed);
}

export function formatLocalFromSqlite(
  dateString: string,
  locale: string = 'es-ES',
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseSqliteUtc(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleString(locale, options);
}
