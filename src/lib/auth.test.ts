import { describe, expect, it } from "vitest";
import { getInitials, isPasswordValid, validatePasswordRules } from "./auth";

describe("validatePasswordRules", () => {
  it("flags each missing requirement independently", () => {
    expect(validatePasswordRules("short")).toEqual({
      length: false,
      uppercase: false,
      number: false,
      symbol: false,
    });
    expect(validatePasswordRules("Abcdefg1")).toEqual({
      length: true,
      uppercase: true,
      number: true,
      symbol: false,
    });
    expect(validatePasswordRules("Abcdefg1!")).toEqual({
      length: true,
      uppercase: true,
      number: true,
      symbol: true,
    });
    expect(isPasswordValid("Abcdefg1")).toBe(false);
    expect(isPasswordValid("Abcdefg1!")).toBe(true);
  });

  it("preserves getInitials behavior", () => {
    expect(getInitials("Alex Rivera")).toBe("AR");
    expect(getInitials("alex@example.com")).toBe("A");
  });
});

