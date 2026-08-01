import { getDashboardModules } from "@/features/dashboard/dashboard-screen";

describe("DashboardScreen", () => {
  it("offers the protected contracts module to a teacher", () => {
    expect(getDashboardModules("TEACHER")).toContainEqual(
      expect.objectContaining({ label: "Contratos", slug: "contracts" }),
    );
  });

  it("offers contract administration to ADMIN", () => {
    expect(getDashboardModules("ADMIN")).toContainEqual(
      expect.objectContaining({ label: "Contratos", slug: "contracts" }),
    );
  });

  it("offers safe operational maintenance to ADMIN", () => {
    expect(getDashboardModules("ADMIN")).toContainEqual(
      expect.objectContaining({ label: "Manutenção", slug: "operations" }),
    );
  });
});
