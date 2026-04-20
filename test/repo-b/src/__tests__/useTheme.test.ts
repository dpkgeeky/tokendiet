import { useTheme, useThemeColor } from "../hooks/useTheme";

describe("useTheme", () => {
  it("should return current theme", () => {
    const { theme } = useTheme();
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
  });

  it("should toggle dark mode", () => {
    const { toggleDarkMode, isDarkMode } = useTheme();
    const initial = isDarkMode;
    toggleDarkMode();
    expect(isDarkMode).not.toBe(initial);
  });

  it("should persist theme preference", () => {
    const { setTheme } = useTheme();
    setTheme("dark");
    const stored = localStorage.getItem("theme");
    expect(stored).toBe("dark");
  });
});

describe("useThemeColor", () => {
  it("should return color from current theme", () => {
    const color = useThemeColor("primary");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("should return fallback for unknown color", () => {
    const color = useThemeColor("nonexistent" as any, "#000000");
    expect(color).toBe("#000000");
  });
});
