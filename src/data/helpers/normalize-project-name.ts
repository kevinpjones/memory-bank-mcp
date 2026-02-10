/**
 * Maximum allowed length for a normalized project directory name.
 * Most filesystems support 255 bytes; we use a conservative limit.
 */
const MAX_NAME_LENGTH = 200;

/**
 * Common Unicode character transliterations to ASCII equivalents.
 */
const TRANSLITERATIONS: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  å: "a",
  æ: "ae",
  ç: "c",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ñ: "n",
  ò: "o",
  ó: "o",
  ô: "o",
  õ: "o",
  ø: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ý: "y",
  ÿ: "y",
  đ: "d",
  ð: "d",
  þ: "th",
  ł: "l",
  ž: "z",
  š: "s",
  č: "c",
  ř: "r",
  ů: "u",
  ě: "e",
  ť: "t",
  ď: "d",
  ň: "n",
};

/**
 * Normalizes a user-provided project name into a filesystem-safe directory name.
 *
 * Rules applied in order:
 * 1. Trim whitespace
 * 2. Convert to lowercase
 * 3. Transliterate common Unicode characters to ASCII
 * 4. Replace spaces and underscores with hyphens
 * 5. Remove characters that are not a-z, 0-9, hyphens, or dots
 * 6. Collapse consecutive hyphens into one
 * 7. Remove leading/trailing hyphens and dots
 * 8. Truncate to MAX_NAME_LENGTH
 * 9. Reject empty results
 *
 * @param input The user-provided project name
 * @returns The normalized, filesystem-safe directory name
 * @throws Error if the input is empty or normalizes to an empty string
 */
export function normalizeProjectName(input: string): string {
  if (!input || !input.trim()) {
    throw new Error("Project name cannot be empty");
  }

  let normalized = input.trim().toLowerCase();

  // Transliterate common Unicode characters
  normalized = normalized
    .split("")
    .map((char) => TRANSLITERATIONS[char] ?? char)
    .join("");

  // Replace spaces and underscores with hyphens
  normalized = normalized.replace(/[\s_]+/g, "-");

  // Remove characters that are not a-z, 0-9, hyphens, or dots
  normalized = normalized.replace(/[^a-z0-9.-]/g, "");

  // Collapse consecutive hyphens
  normalized = normalized.replace(/-{2,}/g, "-");

  // Collapse consecutive dots
  normalized = normalized.replace(/\.{2,}/g, ".");

  // Remove leading/trailing hyphens and dots
  normalized = normalized.replace(/^[-.]/, "").replace(/[-.]$/, "");

  // Truncate to max length
  if (normalized.length > MAX_NAME_LENGTH) {
    normalized = normalized.slice(0, MAX_NAME_LENGTH);
    // Clean up trailing hyphens/dots from truncation
    normalized = normalized.replace(/[-.]$/, "");
  }

  if (!normalized) {
    throw new Error(
      `Project name "${input}" cannot be normalized to a valid directory name`
    );
  }

  return normalized;
}
