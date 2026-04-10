import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import html2pdf from 'html2pdf.js';
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

const parseInsightSections = (content = '') => {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const sections = [];
  let currentSection = {
    title: 'Overview',
    bullets: [],
    paragraphs: []
  };

  const headingRegex = /^(?:\d+\.|\d+\)|#{1,6})\s+(.+)$/;
  const titleLineRegex = /^[A-Z][A-Za-z0-9\s/&()%-]{3,60}:$/;

  lines.forEach((line) => {
    const markdownHeading = line.match(headingRegex);
    const isTitleLine = titleLineRegex.test(line);
    const isBullet = /^[-*•]\s+/.test(line);

    if (markdownHeading || isTitleLine) {
      if (currentSection.bullets.length > 0 || currentSection.paragraphs.length > 0) {
        sections.push(currentSection);
      }

      const title = markdownHeading
        ? markdownHeading[1].replace(/:\s*$/, '')
        : line.replace(/:\s*$/, '');

      currentSection = {
        title,
        bullets: [],
        paragraphs: []
      };
      return;
    }

    if (isBullet) {
      currentSection.bullets.push(line.replace(/^[-*•]\s+/, ''));
      return;
    }

    currentSection.paragraphs.push(line);
  });

  if (currentSection.bullets.length > 0 || currentSection.paragraphs.length > 0) {
    sections.push(currentSection);
  }

  return sections;
};

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

  const insightSections = parseInsightSections(aiInsights?.insights || '');

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

  const handleExportPDF = async () => {
    if (!reportData) return;

    try {
      // Create a temporary container with the report content
      const element = document.createElement('div');
      element.style.padding = '20px';
      element.style.backgroundColor = 'white';
      element.style.fontFamily = 'Arial, sans-serif';
      
      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #10b981; font-size: 24px; margin-bottom: 5px;">🌿 Sustainability Report</h1>
          <p style="color: #6b7280; font-size: 12px;">Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 10px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">📊 Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f3f4f6;">
              <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">Total Trips</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${reportData.summary.totalTrips}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">Total CO2 Saved</td>
              <td style="border: 1px solid #d1d5db; padding: 8px; color: #10b981; font-weight: bold;">${reportData.summary.totalCO2Saved} kg</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">Total Distance</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${reportData.summary.totalDistance} km</td>
            </tr>
            <tr>
              <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">Active Users</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${reportData.summary.uniqueUsers}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 10px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">🚗 Transport Mode Breakdown</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #10b981; color: white;">
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Mode</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Trips</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">CO2 Saved (kg)</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Distance (km)</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.transportBreakdown.map((item, idx) => `
                <tr style="${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${item.mode}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${item.count}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; color: #10b981; font-weight: bold;">${item.co2Saved}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${item.distance}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 10px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">🏫 Faculty Performance</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #10b981; color: white;">
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Faculty</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Users</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Trips</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">CO2 Saved (kg)</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Distance (km)</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.facultyStats.map((faculty, idx) => `
                <tr style="${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
                  <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">${faculty.faculty}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${faculty.users}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${faculty.trips}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; color: #10b981; font-weight: bold;">${faculty.co2Saved}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${faculty.distance}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="page-break-before: always;">
          <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 10px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">🏆 Top Contributors</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #10b981; color: white;">
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Rank</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Name</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Email</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Faculty</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">CO2 Saved (kg)</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Trips</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.topUsers.slice(0, 10).map((user, idx) => `
                <tr style="${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
                  <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">#${idx + 1}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${user.name}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; font-size: 10px;">${user.email}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${user.faculty}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; color: #10b981; font-weight: bold;">${user.co2Saved}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${user.trips}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      
      const opt = {
        margin: 10,
        filename: `sustainability-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report');
    }
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

    const handleAIInsights = async () => {
    setAiLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.faculty) params.append('faculty', filters.faculty);

      const res = await API.post(`/admin/ai-insights?${params.toString()}`);
      
      if (res.data.success) {
        setAiInsights(res.data);
        setShowAiModal(true);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      const errorMsg = error.response?.data?.message || 'Failed to generate AI insights';
      alert(`❌ ${errorMsg}`);
    } finally {
      setAiLoading(false);
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
                onClick={handleAIInsights}
                disabled={aiLoading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate AI-powered insights"
              >
                {aiLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    AI Insights
                  </>
                )}
              </button>
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
                onClick={handleExportPDF}
                className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition flex items-center gap-2"
              >
                <Download size={18} />
                Export PDF
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
              {/* AI Insights Modal */}
        {showAiModal && aiInsights && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-center rounded-t-lg">
                <div className="flex items-center gap-3">
                  <Sparkles size={28} />
                  <div>
                    <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
                    <p className="text-purple-100 text-sm">Generated by Google Gemini 2.5 Flash</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                {/* Data Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{aiInsights.dataSummary.totalTrips}</div>
                    <div className="text-sm text-gray-600">Total Trips</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{aiInsights.dataSummary.totalCO2Saved} kg</div>
                    <div className="text-sm text-gray-600">CO2 Saved</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">{aiInsights.dataSummary.uniqueUsers}</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">{aiInsights.dataSummary.avgCO2PerTrip} kg</div>
                    <div className="text-sm text-gray-600">Avg CO2/Trip</div>
                  </div>
                </div>

                {/* AI Insights Content */}
                <div className="space-y-4">
                  {insightSections.length > 0 ? (
                    insightSections.map((section, index) => (
                      <div key={`${section.title}-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                        <h3 className="text-base font-bold text-gray-900 mb-3">
                          {section.title}
                        </h3>

                        {section.paragraphs.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {section.paragraphs.map((paragraph, pIndex) => (
                              <p key={`${section.title}-p-${pIndex}`} className="text-sm leading-relaxed text-gray-700">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        )}

                        {section.bullets.length > 0 && (
                          <ul className="space-y-2">
                            {section.bullets.map((bullet, bIndex) => (
                              <li key={`${section.title}-b-${bIndex}`} className="flex items-start gap-2 text-sm text-gray-800">
                                <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-purple-600"></span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                        {aiInsights.insights}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiInsights.insights);
                      alert('✅ Insights copied to clipboard!');
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => setShowAiModal(false)}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Reports;
