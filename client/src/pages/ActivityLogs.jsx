import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, Filter, RefreshCw } from 'lucide-react';
import API from '../api/axios';

const defaultFilters = {
  action: '',
  targetType: '',
  limit: 25,
  page: 1,
};

const ActivityLogs = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
    logsPerPage: 25,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('page', String(nextFilters.page));
      params.set('limit', String(nextFilters.limit));
      if (nextFilters.action) params.set('action', nextFilters.action);
      if (nextFilters.targetType) params.set('targetType', nextFilters.targetType);

      const res = await API.get(`/admin/activity-logs?${params.toString()}`);
      setLogs(res.data.logs || []);
      setPagination(
        res.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalLogs: 0,
          logsPerPage: Number(nextFilters.limit),
        },
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to load activity logs. Please try again.',
      );
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const canGoPrev = pagination.currentPage > 1;
  const canGoNext = pagination.currentPage < pagination.totalPages;

  const pageSummary = useMemo(() => {
    if (!pagination.totalLogs) return 'No logs found';
    const start = (pagination.currentPage - 1) * pagination.logsPerPage + 1;
    const end = Math.min(
      pagination.currentPage * pagination.logsPerPage,
      pagination.totalLogs,
    );
    return `Showing ${start}-${end} of ${pagination.totalLogs}`;
  }, [pagination]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const applyFilters = () => {
    const next = { ...filters, page: 1 };
    setFilters(next);
    fetchLogs(next);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    fetchLogs(defaultFilters);
  };

  const goToPage = (page) => {
    const next = { ...filters, page };
    setFilters(next);
    fetchLogs(next);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-linear-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Activity Logs</h1>
            <p className="text-sm text-purple-100">Audit trail for admin actions</p>
          </div>
          <Link
            to="/admin"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="mb-6 rounded-lg bg-white p-5 shadow-md">
          <div className="mb-4 flex items-center gap-2 text-gray-800">
            <Filter size={18} />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="VIEW">VIEW</option>
              <option value="EXPORT">EXPORT</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>

            <select
              value={filters.targetType}
              onChange={(e) => handleFilterChange('targetType', e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Targets</option>
              <option value="USER">USER</option>
              <option value="User">User</option>
              <option value="REPORT">REPORT</option>
              <option value="Report">Report</option>
              <option value="SETTINGS">SETTINGS</option>
              <option value="Settings">Settings</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="System">System</option>
            </select>

            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-md">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-gray-800">
              <FileSearch size={18} />
              <h2 className="text-lg font-semibold">Log Entries</h2>
            </div>
            <button
              onClick={() => fetchLogs()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading activity logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No activity logs found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Time</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Admin</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Target</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Description</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          <div className="font-medium">{log.adminName || 'Unknown Admin'}</div>
                          <div className="text-xs text-gray-500">{log.adminEmail || '-'}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{log.action || '-'}</td>
                        <td className="px-3 py-2 text-gray-700">
                          <div>{log.targetType || '-'}</div>
                          <div className="text-xs text-gray-500">{log.targetId || '-'}</div>
                        </td>
                        <td className="max-w-xs truncate px-3 py-2 text-gray-700" title={log.description || '-'}>
                          {log.description || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                            {log.status || 'SUCCESS'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600">{pageSummary}</p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!canGoPrev}
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.currentPage} / {Math.max(1, pagination.totalPages)}
                  </span>
                  <button
                    disabled={!canGoNext}
                    onClick={() => goToPage(pagination.currentPage + 1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default ActivityLogs;
