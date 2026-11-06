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

export type PasswordRules = {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  symbol: boolean;
};

export function validatePasswordRules(password: string): PasswordRules {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const rules = validatePasswordRules(password);
  return Object.values(rules).every(Boolean);
}
