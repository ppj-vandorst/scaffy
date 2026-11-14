export const START_MARKER = "<!-- scaffy:start -->";
export const END_MARKER = "<!-- scaffy:end -->";

export type SectionResult = "created" | "updated" | "unchanged";

/**
 * Inserts or replaces the scaffy Managed Section in `existing`.
 * Content outside the markers belongs to the user and is never touched.
 * When the file has no section yet, the section is placed at the top.
 */
export function upsertManagedSection(
  existing: string | undefined,
  body: string,
): { content: string; result: SectionResult } {
  const section = `${START_MARKER}\n${body.trim()}\n${END_MARKER}`;

  if (existing === undefined) {
    return { content: `${section}\n`, result: "created" };
  }

  const start = existing.indexOf(START_MARKER);
  const end = existing.indexOf(END_MARKER);

  if (start !== -1 && end > start) {
    const content =
      existing.slice(0, start) + section + existing.slice(end + END_MARKER.length);
    return { content, result: content === existing ? "unchanged" : "updated" };
  }

  return { content: `${section}\n\n${existing}`, result: "updated" };
}
