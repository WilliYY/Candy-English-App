import { getDashboardModules } from "@/features/dashboard/dashboard-screen";

describe("DashboardScreen", () => {
  it("offers the protected contracts module to a teacher", () => {
    expect(getDashboardModules("TEACHER")).toContainEqual(
      expect.objectContaining({ label: "Contratos", slug: "contracts" }),
    );
  });
});
