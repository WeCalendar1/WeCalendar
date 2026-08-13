export function getInitials(nameOrEmail: string | null | undefined): string {
  if (!nameOrEmail) return "?";

  const value = nameOrEmail.trim();
  if (!value) return "?";

  if (value.includes("@")) {
    return value[0]!.toUpperCase();
  }

  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
