import {
  getDefaultReportDateRange,
  defaultAdminSettings,
  ADMIN_SETTINGS_STORAGE_KEY,
} from "./adminSettings";

describe("adminSettings utility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns date range using default report window", () => {
    const { startDate, endDate } = getDefaultReportDateRange();

    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("respects saved defaultReportWindowDays", () => {
    localStorage.setItem(
      ADMIN_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...defaultAdminSettings,
        defaultReportWindowDays: 7,
      }),
    );

    const { startDate, endDate } = getDefaultReportDateRange();
    const dayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / dayMs,
    );

    expect(diffDays).toBe(7);
  });
});
