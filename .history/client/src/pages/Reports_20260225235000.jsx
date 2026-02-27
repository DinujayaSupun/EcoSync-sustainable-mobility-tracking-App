import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  MapPin,
  ArrowLeft,
  Filter,
  BarChart3,
  Award,
  Leaf,
  Mail,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    faculty: ''
  });

  const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.faculty) params.append('faculty', filters.faculty);

      const res = await API.get(`/admin/report?${params.toString()}`);
      if (res.data.success) {
        setReportData(res.data.reportData);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApplyFilters = () => {
    fetchReport();
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const csvRows = [];
    csvRows.push(['Sustainability Report - ' + new Date().toLocaleDateString()]);
    csvRows.push([]);
    csvRows.push(['Summary']);
    csvRows.push(['Total Trips', reportData.summary.totalTrips]);
    csvRows.push(['Total CO2 Saved (kg)', reportData.summary.totalCO2Saved]);
    csvRows.push(['Total Distance (km)', reportData.summary.totalDistance]);
    csvRows.push(['Active Users', reportData.summary.uniqueUsers]);
    csvRows.push([]);
    csvRows.push(['Transport Mode', 'Trips', 'CO2 Saved (kg)', 'Distance (km)']);
    reportData.transportBreakdown.forEach(item => {
      csvRows.push([item.mode, item.count, item.co2Saved, item.distance]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sustainability-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReport = async () => {
    setEmailLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.faculty) params.append('faculty', filters.faculty);

      const res = await API.post(`/admin/email-report?${params.toString()}`);
      
      if (res.data.success) {
        alert(`✅ ${res.data.message}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMsg = error.response?.data?.message || 'Failed to send email report';
      alert(`❌ ${errorMsg}`);
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Generating Report...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-linear-to-r from-green-600 to-emerald-600 shadow-lg print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition print:hidden"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  <FileText size={32} />
                  Sustainability Reports
                </h1>
                <p className="text-green-100 text-sm mt-1">
                  Comprehensive carbon footprint analysis
                </p>
              </div>
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                onClick={handleEmailReport}
                disabled={emailLoading}
                className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Email report to your registered email"
              >
                {emailLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Email Report
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition flex items-center gap-2"
              >
                <FileText size={18} />
                Print
              </button>
              <button
                onClick={handleExportCSV}
                className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition flex items-center gap-2"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 print:hidden">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faculty
              </label>
              <input
                type="text"
                name="faculty"
                value={filters.faculty}
                onChange={handleFilterChange}
                placeholder="e.g., Computing"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Apply Filters'}
              </button>
            </div>
          </div>
        </div>

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Trips</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {reportData.summary.totalTrips}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <MapPin className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">CO2 Saved</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {reportData.summary.totalCO2Saved} kg
                    </p>
                  </div>
                  <div className="bg-emerald-100 p-3 rounded-full">
                    <Leaf className="text-emerald-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Distance</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {reportData.summary.totalDistance} km
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <TrendingUp className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Active Users</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {reportData.summary.uniqueUsers}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Transport Mode Breakdown */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <BarChart3 size={24} />
                  Transport Mode Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.transportBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mode" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#10b981" name="Trips" />
                    <Bar dataKey="co2Saved" fill="#8b5cf6" name="CO2 Saved (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Daily Trends */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <Calendar size={24} />
                  Daily CO2 Savings Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="co2Saved"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="CO2 Saved (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Faculty Stats */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Faculty Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Faculty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trips
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CO2 Saved (kg)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distance (km)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.facultyStats.map((faculty, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {faculty.faculty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {faculty.users}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {faculty.trips}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                          {faculty.co2Saved}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {faculty.distance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <Award size={24} className="text-yellow-500" />
                Top Contributors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.topUsers.slice(0, 6).map((user, idx) => (
                  <div
                    key={idx}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-500 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-green-600">#{idx + 1}</span>
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                        {user.faculty}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">CO2 Saved:</span>
                      <span className="font-bold text-green-600">{user.co2Saved} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Trips:</span>
                      <span className="font-semibold">{user.trips}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;
