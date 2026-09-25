const trustedAvatarHosts = new Set([
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
]);

export function resolveAuthAvatarUrl(
  metadata: Record<string, unknown>,
): string | null {
  const candidates = [metadata.avatar_url, metadata.picture];

  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.length === 0) continue;

    try {
      const url = new URL(candidate);
      if (url.protocol === "https:" && trustedAvatarHosts.has(url.hostname)) {
        return url.toString();
      }
    } catch {
      // Ignore malformed provider metadata and fall back to the user icon.
    }
  }

  return null;
}
