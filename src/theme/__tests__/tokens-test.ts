import { colors, spacing } from "@/theme/tokens";

describe("Candy English design tokens", () => {
  it("preserves the product brand colors", () => {
    expect(colors.brand).toBe("#412A4C");
    expect(colors.energy).toBe("#E57CD8");
    expect(colors.background).toBe("#FEFBFA");
  });

  it("uses a consistent spacing scale", () => {
    expect(spacing.xs).toBeLessThan(spacing.sm);
    expect(spacing.sm).toBeLessThan(spacing.md);
    expect(spacing.md).toBeLessThan(spacing.lg);
  });
});
