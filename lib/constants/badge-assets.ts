/**
 * Badge / title icon paths under public/assets/badges/.
 * Filenames match CDN layout for future Bunny sync.
 */
export function badgeAssetUrl(filename: string): string {
  return `/assets/badges/${filename}`;
}
