import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-cyan-50 text-slate-900">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-10">
                <header className="flex items-center justify-between">
                    <h1 className="text-2xl font-black tracking-tight text-emerald-700">EcoSync</h1>
                    <nav className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            Create account
                        </Link>
                    </nav>
                </header>

                <main className="grid flex-1 items-center gap-12 py-10 md:grid-cols-2 md:py-0">
                    <section>
                        <p className="mb-4 inline-block rounded-full border border-emerald-200 bg-white px-4 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                            Smarter campus commuting
                        </p>
                        <h2 className="text-4xl font-black leading-tight text-slate-900 md:text-5xl">
                            Track trips, reduce emissions, and build better mobility habits.
                        </h2>
                        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                            EcoSync helps students and admins monitor commute impact in one place with analytics,
                            weather-aware suggestions, and sustainability goals.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Link
                                to="/register"
                                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                            >
                                Get started
                            </Link>
                            <Link
                                to="/login"
                                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                                I already have an account
                            </Link>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-700">What you can do</h3>
                        <div className="mt-5 space-y-4">
                            <article className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <h4 className="text-base font-bold text-slate-900">Log and analyze commutes</h4>
                                <p className="mt-1 text-sm text-slate-600">
                                    Save trip details and see distance, duration, and emissions trends.
                                </p>
                            </article>
                            <article className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <h4 className="text-base font-bold text-slate-900">Get sustainable suggestions</h4>
                                <p className="mt-1 text-sm text-slate-600">
                                    Use weather and distance insights to choose greener transport options.
                                </p>
                            </article>
                            <article className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <h4 className="text-base font-bold text-slate-900">Compete and improve</h4>
                                <p className="mt-1 text-sm text-slate-600">
                                    Earn badges and climb the leaderboard while reducing your carbon footprint.
                                </p>
                            </article>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Landing;