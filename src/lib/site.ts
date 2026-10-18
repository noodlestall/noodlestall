export const SITE = {
  name: 'Boathouse Noodles',
  tagline: 'Personal Recipe Archive',
  description: 'A personal archive of typewritten recipes for family and friends.',
  /** Production origin. Override with the SITE env variable for forks. */
  url: 'https://noodlestall.github.io',
  /** GitHub Pages project path. Must match `base` in astro.config.mjs. */
  base: '/noodlestall/'
} as const;

/** Joins a base path and a relative path without doubling slashes. */
export function joinPath(base: string, path: string): string {
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}

/** Path to a recipe page, including the site base and trailing slash. */
export function recipePath(base: string, id: string): string {
  return joinPath(base, `recipes/${id}/`);
}

/** Absolute URL for canonical links, Open Graph and sharing. */
export function absoluteUrl(origin: string, path: string): string {
  const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  return `${cleanOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

/** "25 min", "1 h", "1 h 10 min" */
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

/** ISO 8601 duration for schema.org, e.g. PT1H10M */
export function isoDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  let out = 'PT';
  if (hours > 0) out += `${hours}H`;
  if (rest > 0 || hours === 0) out += `${rest}M`;
  return out;
}

/** "No. 004" – archive style recipe number. */
export function formatRecipeNumber(n: number): string {
  return `No. ${String(n).padStart(3, '0')}`;
}

/** Title-cases a lowercase identifier such as "middle-eastern" → "Middle-Eastern". */
export function titleCase(value: string): string {
  return value
    .split(/(\s+|-)/)
    .map((part) => (part.length > 0 && /[a-z]/i.test(part[0]!) ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join('');
}

/** JSON safe to embed inside a <script> tag: "<" is escaped so "</script>" in content cannot break out. */
export function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
