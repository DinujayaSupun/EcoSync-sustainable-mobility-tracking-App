import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/common/Footer';
import UserNavbar from '../components/common/UserNavbar';

const PrivacyPolicy = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-50 via-white to-emerald-100">
      <UserNavbar userName={user?.name} onLogout={handleLogout} />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-lg">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-900 sm:text-4xl">Privacy Policy</h1>
            <button
              onClick={() => navigate('/home')}
              className="rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="space-y-6 text-sm leading-7 text-gray-700">
            <p>
              EcoSync respects your privacy and processes personal information only to provide commute tracking,
              analytics, and app functionality.
            </p>

            <div>
              <h2 className="mb-2 text-lg font-bold text-emerald-800">1. Data We Collect</h2>
              <p>Account details, commute entries, route information, and feature usage metrics.</p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-emerald-800">2. How We Use Data</h2>
              <p>To calculate emissions, improve recommendations, maintain security, and enhance user experience.</p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-emerald-800">3. Data Protection</h2>
              <p>We apply appropriate technical and organizational safeguards to protect stored information.</p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-emerald-800">4. Your Rights</h2>
              <p>You may request access, correction, or deletion of your personal data via support channels.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
