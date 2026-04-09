import { useNavigate } from 'react-router-dom';
import Footer from '../components/common/Footer';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-3xl border border-emerald-200 bg-white p-8 shadow-lg">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-900 sm:text-4xl">About EcoSync</h1>
            <button
              onClick={() => navigate('/home')}
              className="rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
            >
              Back to Dashboard
            </button>
          </div>
          <p className="max-w-3xl text-base leading-7 text-gray-700">
            EcoSync helps students and staff make smarter commuting decisions with data-driven insights.
            We track transport choices, emissions, and progress so users can build sustainable travel habits.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-md">
            <h2 className="mb-3 text-xl font-bold text-emerald-800">Our Mission</h2>
            <p className="text-sm leading-6 text-gray-700">
              Reduce commute-related carbon emissions by turning everyday transport data into practical action.
            </p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-md">
            <h2 className="mb-3 text-xl font-bold text-emerald-800">What We Offer</h2>
            <p className="text-sm leading-6 text-gray-700">
              Emission tracking, weather-aware suggestions, badges, leaderboards, and progress analytics in one place.
            </p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-md">
            <h2 className="mb-3 text-xl font-bold text-emerald-800">Our Community</h2>
            <p className="text-sm leading-6 text-gray-700">
              A growing network of eco-conscious commuters committed to cleaner transport and measurable impact.
            </p>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
