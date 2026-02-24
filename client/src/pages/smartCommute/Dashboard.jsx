import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { healthCheck } from '../../api/smartCommute';

const SmartCommuteDashboard = () => {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await healthCheck();
      setHealth(response);
    } catch (error) {
      console.error('Error checking health:', error);
    }
  };

  const features = [
    {
      id: 'weather',
      title: 'Weather-Based Suggestions',
      icon: '☁️',
      description: 'Get eco-friendly transport recommendations based on current weather conditions',
      color: 'from-blue-500 to-blue-700',
      path: '/smart-commute/weather',
      stats: ['Real-time weather data', 'Smart suggestions', 'History tracking'],
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🚀 Smart Commute & Logistics
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            University Carbon Tracking System - Smart Transport Module
          </p>
          {health && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mt-4">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {health.message} - v{health.version}
            </div>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <div
              key={feature.id}
              onClick={() => navigate(feature.path)}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden"
            >
              {/* Card Header with Gradient */}
              <div className={`bg-linear-to-r ${feature.color} p-6 text-white`}>
                <div className="text-5xl mb-3">{feature.icon}</div>
                <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <p className="text-gray-600 mb-4 min-h-15">
                  {feature.description}
                </p>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  {feature.stats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span>
                      <span>{stat}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors font-medium">
                  Launch Feature →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Benefits Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              🌟 Key Benefits
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-semibold text-gray-800">Data-Driven Decisions</div>
                  <p className="text-sm text-gray-600">
                    Make informed choices with real-time data and AI predictions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌍</span>
                <div>
                  <div className="font-semibold text-gray-800">Reduce Carbon Footprint</div>
                  <p className="text-sm text-gray-600">
                    Track and minimize your environmental impact
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-semibold text-gray-800">Save Money</div>
                  <p className="text-sm text-gray-600">
                    Find the most cost-effective transport options
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <div className="font-semibold text-gray-800">Real-Time Updates</div>
                  <p className="text-sm text-gray-600">
                    Get weather, traffic, and route updates instantly
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-linear-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-4">📈 Module Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">1</div>
                <div className="text-sm text-green-100">Features</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">18</div>
                <div className="text-sm text-green-100">API Endpoints</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">20+</div>
                <div className="text-sm text-green-100">Transport Modes</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">∞</div>
                <div className="text-sm text-green-100">Possibilities</div>
              </div>
            </div>

            <div className="mt-6 bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-green-100">
                💡 Powered by OpenWeatherMap API
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🎯 How It Works
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">1️⃣</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Choose a Feature</h4>
              <p className="text-sm text-gray-600">
                Select from our Weather-Based Transport Suggestion feature
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2️⃣</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Input Your Data</h4>
              <p className="text-sm text-gray-600">
                Enter your location, preferences, or tracking information
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">3️⃣</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Get Insights</h4>
              <p className="text-sm text-gray-600">
                Receive AI-powered recommendations and actionable insights
              </p>
            </div>
          </div>
        </div>

        {/* API Integration Info */}
        <div className="bg-linear-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">🔌 API Integration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">External APIs Used:</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• OpenWeatherMap API - Real-time weather data</li>
                <li>• Google Distance Matrix API - Route analysis</li>
                <li>• Custom AI Algorithm - Transport predictions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Features:</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Real-time data processing</li>
                <li>• Machine learning predictions</li>
                <li>• Comprehensive CO₂ calculations</li>
                <li>• RESTful API architecture</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Smart Commute & Logistics v1.0.0</p>
          <p className="mt-1">Part of University Carbon Tracking System</p>
        </div>
      </div>
    </div>
  );
};

export default SmartCommuteDashboard;
