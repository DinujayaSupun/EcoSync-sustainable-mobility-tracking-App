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
      icon: 'cloud',
      description: 'Get eco-friendly transport recommendations based on current weather conditions',
      color: 'from-blue-600 to-indigo-700',
      path: '/smart-commute/weather',
      stats: ['Real-time weather data', 'Smart suggestions', 'History tracking'],
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/40 to-green-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

          <div className="relative px-6 py-10 sm:px-10 sm:py-12">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
                <span className="material-icons" style={{fontSize: '18px'}}>rocket_launch</span>
                Smart Commute Module
              </div>
              <h1 className="flex flex-wrap items-center justify-center gap-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                <span className="material-icons text-emerald-600" style={{fontSize: '44px'}}>electric_moped</span>
                Smart Commute & Logistics
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                University Carbon Tracking System - Smart Transport Module
              </p>

              {health && (
                <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                  {health.message} - v{health.version}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Feature Card */}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => navigate(feature.path)}
              className="group overflow-hidden rounded-3xl border border-emerald-100 bg-white text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className={`bg-linear-to-r ${feature.color} px-6 py-6 text-white sm:px-7`}>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <span className="material-icons text-white" style={{fontSize: '32px'}}>{feature.icon}</span>
                </div>
                <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{feature.title}</h2>
                <p className="mt-3 max-w-xl text-sm text-white/90 sm:text-base">{feature.description}</p>
              </div>

              <div className="space-y-5 px-6 py-6 sm:px-7">
                <div className="grid gap-3 sm:grid-cols-3">
                  {feature.stats.map((stat) => (
                    <div key={stat} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-icons" style={{fontSize: '18px'}}>check_circle</span>
                        <span>{stat}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition group-hover:bg-emerald-700">
                  <span className="material-icons" style={{fontSize: '18px'}}>open_in_new</span>
                  Launch Feature
                  <span className="material-icons" style={{fontSize: '18px'}}>arrow_forward</span>
                </div>
              </div>
            </button>
          ))}

          <div className="grid gap-6">
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <span className="material-icons text-emerald-600" style={{fontSize: '28px'}}>insights</span>
                  Module Snapshot
                </h3>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Live</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '1', label: 'Feature', icon: 'extension' },
                  { value: '18', label: 'API Endpoints', icon: 'api' },
                  { value: '20+', label: 'Transport Modes', icon: 'commute' },
                  { value: '∞', label: 'Possibilities', icon: 'all_inclusive' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-100 bg-linear-to-br from-slate-50 to-emerald-50/50 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between text-emerald-700">
                      <span className="material-icons" style={{fontSize: '20px'}}>{stat.icon}</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                    <div className="mt-1 text-sm font-medium text-slate-600">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 text-sm font-medium text-emerald-800">
                <div className="flex items-center gap-2">
                  <span className="material-icons" style={{fontSize: '18px'}}>lightbulb</span>
                  Powered by OpenWeatherMap API
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-600 to-green-700 p-6 text-white shadow-lg">
              <h3 className="mb-5 flex items-center gap-2 text-2xl font-bold">
                <span className="material-icons" style={{fontSize: '28px'}}>route</span>
                What You Get
              </h3>
              <div className="space-y-4">
                {[
                  ['Data-Driven Decisions', 'Make informed choices with real-time data and AI predictions', 'query_stats'],
                  ['Reduce Carbon Footprint', 'Track and minimize your environmental impact', 'eco'],
                  ['Save Money', 'Find the most cost-effective transport options', 'savings'],
                  ['Real-Time Updates', 'Get weather, traffic, and route updates instantly', 'speed'],
                ].map(([title, body, icon]) => (
                  <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <span className="material-icons mt-0.5" style={{fontSize: '22px'}}>{icon}</span>
                    <div>
                      <div className="font-semibold">{title}</div>
                      <p className="text-sm text-emerald-50/90">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Workflow</p>
            <h3 className="mt-2 flex items-center justify-center gap-2 text-3xl font-bold text-slate-900">
              <span className="material-icons text-emerald-600" style={{fontSize: '30px'}}>tour</span>
              How It Works
            </h3>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { step: '01', title: 'Choose a Feature', body: 'Select the weather-based transport suggestion module.', icon: 'dashboard_customize', color: 'bg-blue-50 text-blue-700' },
              { step: '02', title: 'Input Your Data', body: 'Enter your location, preferences, or tracking information.', icon: 'edit_location_alt', color: 'bg-emerald-50 text-emerald-700' },
              { step: '03', title: 'Get Insights', body: 'Receive AI-powered recommendations and actionable insights.', icon: 'auto_awesome', color: 'bg-violet-50 text-violet-700' },
            ].map((item) => (
              <div key={item.step} className="rounded-3xl border border-slate-100 bg-linear-to-br from-white to-slate-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}>
                  <span className="material-icons" style={{fontSize: '28px'}}>{item.icon}</span>
                </div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Step {item.step}</div>
                <h4 className="text-xl font-bold text-slate-900">{item.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* API Integration */}
        <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
          <div className="mb-6 flex items-center gap-2">
            <span className="material-icons text-emerald-400" style={{fontSize: '28px'}}>integration_instructions</span>
            <h3 className="text-2xl font-bold">API Integration</h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <span className="material-icons text-emerald-400" style={{fontSize: '20px'}}>dns</span>
                External APIs Used
              </h4>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2"><span className="material-icons mt-0.5 text-emerald-400" style={{fontSize: '16px'}}>check_circle</span><span>OpenWeatherMap API - Real-time weather data</span></li>
                <li className="flex items-start gap-2"><span className="material-icons mt-0.5 text-emerald-400" style={{fontSize: '16px'}}>check_circle</span><span>Google Distance Matrix API - Route analysis</span></li>
                <li className="flex items-start gap-2"><span className="material-icons mt-0.5 text-emerald-400" style={{fontSize: '16px'}}>check_circle</span><span>Custom AI Algorithm - Transport predictions</span></li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <span className="material-icons text-emerald-400" style={{fontSize: '20px'}}>verified</span>
                Platform Features
              </h4>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2"><span className="material-icons mt-0.5 text-emerald-400" style={{fontSize: '16px'}}>check_circle</span><span>Real-time data processing</span></li>
                <li className="flex items-start gap-2"><span className="material-icons mt-0.5 text-emerald-400" style={{fontSize: '16px'}}>check_circle</span><span>Machine learning predictions</span></li>
                <li className="flex items-start gap-2"><span className="material-icons mt-0.5 text-emerald-400" style={{fontSize: '16px'}}>check_circle</span><span>Comprehensive CO₂ calculations</span></li>
                <li className="flex items-start gap-2"><span className="material-icons mt-0.5 text-emerald-400" style={{fontSize: '16px'}}>check_circle</span><span>RESTful API architecture</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-2 text-center text-sm text-slate-500">
          <p className="font-medium text-slate-700">Smart Commute & Logistics v1.0.0</p>
          <p className="mt-1">Part of University Carbon Tracking System</p>
        </footer>
      </div>
    </div>
  );
};

export default SmartCommuteDashboard;
