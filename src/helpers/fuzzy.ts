// simple fuzzy matching utility
// returns true if all characters in `pattern` appear in order within `text`
// ignoring case, diacritics, and allowing other characters in between.
function stripDiacritics(s: string): string {
  // decompose unicode and remove combining diacritic marks
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function fuzzyMatch(text: string, pattern: string): boolean {
  // normalize case and strip accents so searches are accent-insensitive
  const t = stripDiacritics(text).toLowerCase();
  const p = stripDiacritics(pattern).toLowerCase().trim();
  if (p.length === 0) return true;
  let pi = 0;
  for (let i = 0; i < t.length && pi < p.length; i++) {
    if (t[i] === p[pi]) {
      pi++;
    }
  }
  return pi === p.length;
}
