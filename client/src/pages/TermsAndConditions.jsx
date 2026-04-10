import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/common/Footer';
import UserNavbar from '../components/common/UserNavbar';

const TermsAndConditions = () => {
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
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-900 sm:text-4xl">Terms and Conditions</h1>
            <button
              onClick={() => navigate('/home')}
              className="rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="space-y-6 text-sm leading-7 text-gray-700">
            <p>
              By using EcoSync, you agree to these terms and to use the platform responsibly.
            </p>

            <div>
              <h2 className="mb-2 text-lg font-bold text-emerald-800">1. Acceptable Use</h2>
              <p>You agree to provide accurate commute data and avoid misuse, abuse, or unauthorized access attempts.</p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-emerald-800">2. Account Responsibility</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-emerald-800">3. Service Availability</h2>
              <p>Features may evolve over time, and temporary downtime may occur during maintenance or updates.</p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-emerald-800">4. Limitation</h2>
              <p>EcoSync provides informational insights and does not guarantee specific environmental outcomes.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
