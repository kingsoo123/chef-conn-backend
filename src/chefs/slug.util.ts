export function slugifyDisplayName(displayName: string): string {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function buildUniqueChefSlug(
  displayName: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugifyDisplayName(displayName) || 'chef';
  let candidate = base;
  let suffix = 1;

  while (await isTaken(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
