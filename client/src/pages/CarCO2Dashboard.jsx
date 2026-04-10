import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import UserNavbar from '../components/common/UserNavbar';
import Footer from '../components/common/Footer';
import API from '../api/axios';

const CarCO2Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [carImpactData, setCO2ImpactData] = useState(null);
  const [co2ByMode, setCO2ByMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCarImpactData();
    fetchCO2ByMode();
  }, []);

  const fetchCarImpactData = async () => {
    try {
      const { data } = await API.get('/commute/car-usage-impact');
      setCO2ImpactData(data.data);
    } catch (err) {
      console.error('Failed to fetch car impact data:', err);
      setError('Failed to load car usage data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCO2ByMode = async () => {
    try {
      const { data } = await API.get('/commute/co2-savings-by-mode');
      setCO2ByMode(data.data);
    } catch (err) {
      console.error('Failed to fetch CO2 by mode:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <UserNavbar userName={user?.name} onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-40 rounded-lg bg-emerald-100"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <UserNavbar userName={user?.name} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 rounded-2xl border border-emerald-100 bg-white shadow-lg overflow-hidden">
          <div className="bg-linear-to-r from-emerald-700 to-green-600 px-6 py-8 text-white">
            <h1 className="text-4xl font-bold mb-2">🚗 Car Usage & CO₂ Impact</h1>
            <p className="text-emerald-100">Track your car usage and the CO₂ you've saved by choosing alternatives</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 m-4">
              {error}
            </div>
          )}

          {carImpactData && (
            <div className="p-6 sm:p-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* Car Usage Card */}
                <div className="rounded-xl border-2 border-red-200 bg-linear-to-br from-red-50 to-red-100 p-5 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="material-icons" style={{fontSize: '28px', color: '#dc2626'}}>directions_car</span>
                  </div>
                  <h4 className="text-xs font-semibold text-red-700 mb-2">Car Trips</h4>
                  <p className="text-3xl font-bold text-red-900">{carImpactData.summary.totalCarTrips}</p>
                  <p className="text-xs text-red-600 mt-1">{carImpactData.summary.carUsagePercentage}% of all trips</p>
                </div>

                {/* Car Distance Card */}
                <div className="rounded-xl border-2 border-orange-200 bg-linear-to-br from-orange-50 to-orange-100 p-5 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="material-icons" style={{fontSize: '28px', color: '#ea580c'}}>straighten</span>
                  </div>
                  <h4 className="text-xs font-semibold text-orange-700 mb-2">Car Distance</h4>
                  <p className="text-3xl font-bold text-orange-900">{carImpactData.summary.totalCarDistance} <span className="text-lg">km</span></p>
                </div>

                {/* Car Emissions Card */}
                <div className="rounded-xl border-2 border-amber-200 bg-linear-to-br from-amber-50 to-amber-100 p-5 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="material-icons" style={{fontSize: '28px', color: '#b45309'}}>cloud</span>
                  </div>
                  <h4 className="text-xs font-semibold text-amber-700 mb-2">Car Emissions</h4>
                  <p className="text-3xl font-bold text-amber-900">{carImpactData.summary.totalCarEmissions} <span className="text-lg">kg</span></p>
                </div>

                {/* CO2 Saved Card */}
                <div className="rounded-xl border-2 border-green-200 bg-linear-to-br from-green-50 to-green-100 p-5 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="material-icons" style={{fontSize: '28px', color: '#059669'}}>eco</span>
                  </div>
                  <h4 className="text-xs font-semibold text-green-700 mb-2">CO₂ Saved by Alternates</h4>
                  <p className="text-3xl font-bold text-green-900">{carImpactData.summary.co2SavedByUsingAlternatives} <span className="text-lg">kg</span></p>
                </div>
              </div>

              {/* Monthly Breakdown */}
              {carImpactData.monthlyBreakdown && carImpactData.monthlyBreakdown.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-md mb-8">
                  <h3 className="text-2xl font-bold text-emerald-900 mb-4">Monthly Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-emerald-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-900">Month</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-red-900">Car Trips</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-orange-900">Car Distance (km)</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-amber-900">Car Emissions (kg)</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-blue-900">Alternative Trips</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-green-900">CO₂ Saved (kg)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {carImpactData.monthlyBreakdown.map((month, idx) => (
                          <tr key={idx} className="hover:bg-emerald-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.month}</td>
                            <td className="px-4 py-3 text-center text-sm text-red-600 font-semibold">{month.carTrips}</td>
                            <td className="px-4 py-3 text-center text-sm text-orange-600 font-semibold">{month.carDistance}</td>
                            <td className="px-4 py-3 text-center text-sm text-amber-600 font-semibold">{month.carEmissions}</td>
                            <td className="px-4 py-3 text-center text-sm text-blue-600 font-semibold">{month.alternativeTrips}</td>
                            <td className="px-4 py-3 text-center text-sm text-green-600 font-bold">{month.co2Saved}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CO2 by Transport Mode */}
        {co2ByMode && co2ByMode.length > 0 && (
          <div className="rounded-2xl border border-blue-200 bg-white shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">🚌 CO₂ Savings by Transport Mode</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {co2ByMode.map((mode) => (
                <div
                  key={mode.transportType}
                  className="rounded-lg border-2 border-blue-200 bg-linear-to-br from-blue-50 to-blue-100 p-4"
                >
                  <h4 className="font-bold text-blue-900 mb-2">{mode.transportType}</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <span className="font-semibold">Trips:</span> {mode.count}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">CO₂ Saved:</span> {mode.totalCO2Saved} kg
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">Distance:</span> {mode.totalDistance} km
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">Per km:</span> {mode.avgCO2PerKm} kg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact Summary */}
        <div className="rounded-2xl border-2 border-lime-200 bg-linear-to-br from-lime-50 to-green-50 p-6 shadow-md">
          <h3 className="text-2xl font-bold text-lime-900 mb-4">💚 Your Eco Impact</h3>
          <div className="space-y-3 text-lg">
            <p className="text-gray-700">
              <span className="font-bold">Total Trips Logged:</span> {carImpactData?.totalTrips || 0}
            </p>
            <p className="text-gray-700">
              <span className="font-bold">Car Usage Rate:</span> {carImpactData?.summary.carUsagePercentage || 0}%
            </p>
            <p className="text-green-700 font-semibold">
              ✅ By using alternatives instead of car, you've saved{' '}
              <span className="text-2xl text-green-900">{carImpactData?.summary.co2SavedByUsingAlternatives || 0} kg</span> of CO₂!
            </p>
            <p className="text-gray-600 text-sm mt-4">
              Keep it up! Every alternative trip reduces your carbon footprint and helps the environment.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CarCO2Dashboard;
