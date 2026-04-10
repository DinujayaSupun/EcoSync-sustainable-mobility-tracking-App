export const ADMIN_SETTINGS_STORAGE_KEY = "ecosync_admin_settings";

export const defaultAdminSettings = {
  liveFeedRefreshSeconds: 30,
  defaultReportWindowDays: 30,
  emailReportAlerts: true,
  aiInsightsEnabled: true,
  strictAdminGuards: true,
};

export const getAdminSettings = () => {
  try {
    const raw = localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
    if (!raw) return defaultAdminSettings;

    const parsed = JSON.parse(raw);
    return { ...defaultAdminSettings, ...parsed };
  } catch (error) {
    console.error("Failed to parse admin settings:", error);
    return defaultAdminSettings;
  }
};

export const saveAdminSettings = (settings) => {
  localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

export const getDefaultReportDateRange = () => {
  const settings = getAdminSettings();
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Number(settings.defaultReportWindowDays || 30));

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
};
