/** Reads a single-line `description:` value from a markdown file's YAML frontmatter. */
export function readDescription(markdown: string): string | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if (!match) return undefined;
  const line = match[1].split(/\r?\n/).find((l) => l.startsWith("description:"));
  if (!line) return undefined;
  return line
    .slice("description:".length)
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2");
}
