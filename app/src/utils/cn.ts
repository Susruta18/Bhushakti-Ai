// Simple cn utility — avoids a dependency on clsx
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
