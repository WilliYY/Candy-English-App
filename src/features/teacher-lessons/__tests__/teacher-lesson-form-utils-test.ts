import {
  formatDateTimeInput,
  parseDateTimeInput,
} from "@/features/teacher-lessons/teacher-lesson-form-utils";

describe("teacher lesson date input", () => {
  it("parses one exact Brazilian local date and time", () => {
    const value = parseDateTimeInput("05/08/2026 09:30");
    const date = new Date(value ?? "invalid");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(5);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(30);
  });

  it("rejects impossible or incomplete dates", () => {
    expect(parseDateTimeInput("31/02/2026 10:00")).toBeNull();
    expect(parseDateTimeInput("05/08/2026")).toBeNull();
  });

  it("keeps an empty optional schedule empty", () => {
    expect(parseDateTimeInput("  ")).toBe("");
    expect(formatDateTimeInput(null)).toBe("");
  });
});
