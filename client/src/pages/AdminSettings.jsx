import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, Settings, Bell, Shield, Gauge } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const STORAGE_KEY = 'ecosync_admin_settings';

const defaultSettings = {
  liveFeedRefreshSeconds: 30,
  defaultReportWindowDays: 30,
  emailReportAlerts: true,
  aiInsightsEnabled: true,
  strictAdminGuards: true,
};

const AdminSettings = () => {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState(defaultSettings);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setSettings({ ...defaultSettings, ...parsed });
    } catch (error) {
      console.error('Failed to load admin settings:', error);
    }
  }, []);

  const updateField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSavedMessage('Settings saved successfully.');
    setTimeout(() => setSavedMessage(''), 2500);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
    setSavedMessage('Settings reset to default values.');
    setTimeout(() => setSavedMessage(''), 2500);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-linear-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">System Settings</h1>
            <p className="text-purple-100 text-sm">Configure admin dashboard behavior and report defaults</p>
          </div>
          <span className="text-white text-sm font-medium">{user?.name}</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-900 font-medium"
        >
          <ArrowLeft size={18} />
          Back to Admin Dashboard
        </Link>

        {savedMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
            {savedMessage}
          </div>
        )}

        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-gray-800">Dashboard Behavior</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Live feed refresh interval</label>
              <select
                value={settings.liveFeedRefreshSeconds}
                onChange={(e) => updateField('liveFeedRefreshSeconds', Number(e.target.value))}
                className="w-full md:w-72 border border-gray-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
              >
                <option value={15}>Every 15 seconds</option>
                <option value={30}>Every 30 seconds</option>
                <option value={60}>Every 60 seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default report window</label>
              <select
                value={settings.defaultReportWindowDays}
                onChange={(e) => updateField('defaultReportWindowDays', Number(e.target.value))}
                className="w-full md:w-72 border border-gray-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-green-600" size={20} />
            <h2 className="text-xl font-bold text-gray-800">Reports and Notifications</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-gray-700">Enable email report alerts</span>
              <input
                type="checkbox"
                checked={settings.emailReportAlerts}
                onChange={(e) => updateField('emailReportAlerts', e.target.checked)}
                className="h-4 w-4 accent-purple-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-gray-700">Enable AI insights features</span>
              <input
                type="checkbox"
                checked={settings.aiInsightsEnabled}
                onChange={(e) => updateField('aiInsightsEnabled', e.target.checked)}
                className="h-4 w-4 accent-purple-600"
              />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-red-600" size={20} />
            <h2 className="text-xl font-bold text-gray-800">Security Controls</h2>
          </div>

          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <span className="text-gray-700">Enforce strict admin guards</span>
            <input
              type="checkbox"
              checked={settings.strictAdminGuards}
              onChange={(e) => updateField('strictAdminGuards', e.target.checked)}
              className="h-4 w-4 accent-purple-600"
            />
          </label>

          <p className="text-xs text-gray-500 mt-3">
            These controls are currently stored per browser and are designed to match current admin workflows.
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <Save size={16} />
            Save Settings
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <RotateCcw size={16} />
            Reset Defaults
          </button>

          <div className="ml-auto text-sm text-gray-500 flex items-center gap-2">
            <Settings size={14} />
            Admin settings version 1
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;