import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/common/Footer';
import UserNavbar from '../components/common/UserNavbar';

const ContactSupport = () => {
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
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-900 sm:text-4xl">Contact Support</h1>
            <button
              onClick={() => navigate('/home')}
              className="rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
            >
              Back to Dashboard
            </button>
          </div>

          <p className="mb-8 text-sm leading-7 text-gray-700">
            Need help with your account, commute logs, or analytics? Reach out to the EcoSync support team.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
              <h2 className="mb-2 text-lg font-bold text-emerald-800">Email Support</h2>
              <p className="text-sm text-gray-700">support@ecosync.app</p>
              <p className="mt-2 text-xs text-gray-600">Response time: within 24 hours</p>
            </article>

            <article className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
              <h2 className="mb-2 text-lg font-bold text-emerald-800">Help Desk Hours</h2>
              <p className="text-sm text-gray-700">Monday to Friday</p>
              <p className="text-sm text-gray-700">8:30 AM - 5:00 PM</p>
            </article>

            <article className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 sm:col-span-2">
              <h2 className="mb-2 text-lg font-bold text-emerald-800">Issue Checklist</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
                <li>Include screenshots where possible.</li>
                <li>Mention the page and action where the issue happened.</li>
                <li>Add your account email and approximate time of the issue.</li>
              </ul>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactSupport;
