import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/common/Footer';
import UserNavbar from '../components/common/UserNavbar';
import { AuthContext } from '../context/AuthContext';
import { ChallengesAPI } from '../api/challenges.api';

const TRANSPORT_OPTIONS = ['BUS', 'TRAIN', 'BIKE', 'WALK', 'CAR', 'VAN'];
const DIFFICULTY_OPTIONS = ['EASY', 'MEDIUM', 'HARD'];
const TYPE_OPTIONS = ['INDIVIDUAL', 'SQUAD'];

const toLabel = (value) => {
  if (!value) return '-';
  return String(value)
    .toLowerCase()
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
};

const prettyNumber = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  if (number % 1 === 0) return String(number);
  return number.toFixed(2);
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const ChallengeCard = ({ challenge, actionSlot, footerSlot }) => (
  <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          {toLabel(challenge.type)}
        </p>
        <h3 className="mt-2 text-lg font-bold text-emerald-950">{challenge.title}</h3>
      </div>
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
        {toLabel(challenge.difficulty)}
      </span>
    </div>

    <p className="mt-3 text-sm leading-6 text-gray-700">{challenge.description}</p>

    {challenge.tagline ? (
      <p className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
        {challenge.tagline}
      </p>
    ) : null}

    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
      <div className="rounded-lg bg-gray-50 p-2.5">
        <p className="text-xs text-gray-500">Mode</p>
        <p className="font-semibold text-gray-900">{toLabel(challenge.transportMode)}</p>
      </div>
      <div className="rounded-lg bg-gray-50 p-2.5">
        <p className="text-xs text-gray-500">Target</p>
        <p className="font-semibold text-gray-900">{prettyNumber(challenge.emissionTarget)} kg CO2</p>
      </div>
      <div className="rounded-lg bg-gray-50 p-2.5">
        <p className="text-xs text-gray-500">Duration</p>
        <p className="font-semibold text-gray-900">{prettyNumber(challenge.durationDays)} days</p>
      </div>
      <div className="rounded-lg bg-gray-50 p-2.5">
        <p className="text-xs text-gray-500">Deadline</p>
        <p className="font-semibold text-gray-900">{formatDate(challenge.deadline)}</p>
      </div>
    </div>

    {footerSlot ? <div className="mt-4">{footerSlot}</div> : null}
    {actionSlot ? <div className="mt-4">{actionSlot}</div> : null}
  </div>
);

const Challenges = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('discover');
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [myLoading, setMyLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const [discoverError, setDiscoverError] = useState('');
  const [myError, setMyError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [banner, setBanner] = useState('');

  const [challenges, setChallenges] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [myChallenges, setMyChallenges] = useState([]);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [busyMap, setBusyMap] = useState({});
  const [progressInputs, setProgressInputs] = useState({});

  const [filters, setFilters] = useState({
    type: '',
    difficulty: '',
    transportMode: '',
  });

  const [createForm, setCreateForm] = useState({
    transportMode: 'BIKE',
    emissionTarget: 5,
    durationDays: 7,
    difficulty: 'EASY',
    type: 'INDIVIDUAL',
    rewardPoints: 100,
  });

  const joinedChallengeIds = useMemo(
    () => new Set(myChallenges.map((entry) => String(entry?.challenge?._id || entry?.challenge))),
    [myChallenges],
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const withBusy = async (key, fn) => {
    setBusyMap((prev) => ({ ...prev, [key]: true }));
    try {
      await fn();
    } finally {
      setBusyMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const loadDiscover = useCallback(async (requestedPage = 1, currentFilters = {}) => {
    setDiscoverLoading(true);
    setDiscoverError('');

    try {
      const response = await ChallengesAPI.getChallenges({
        page: requestedPage,
        limit: 9,
        ...currentFilters,
      });
      setChallenges(response.challenges || []);
      setPage(Number(response.page || requestedPage));
      setPages(Number(response.pages || 1));
    } catch (error) {
      setDiscoverError(error?.response?.data?.message || 'Failed to load challenges.');
      setChallenges([]);
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  const loadMyChallenges = useCallback(async () => {
    setMyLoading(true);
    setMyError('');

    try {
      const rows = await ChallengesAPI.getMyChallenges();
      setMyChallenges(rows);
      setProgressInputs(
        rows.reduce((acc, row) => {
          acc[row.challenge?._id || row.challenge] = '';
          return acc;
        }, {}),
      );
    } catch (error) {
      setMyError(error?.response?.data?.message || 'Failed to load your challenges.');
      setMyChallenges([]);
    } finally {
      setMyLoading(false);
    }
  }, []);

  const loadRecommended = useCallback(async () => {
    setRecommendedLoading(true);
    try {
      const rows = await ChallengesAPI.getRecommended();
      setRecommended(rows || []);
    } catch {
      setRecommended([]);
    } finally {
      setRecommendedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyChallenges();
    loadRecommended();
  }, [loadMyChallenges, loadRecommended]);

  useEffect(() => {
    loadDiscover(1, filters);
  }, [filters, loadDiscover]);

  const refreshAll = async () => {
    await Promise.all([loadDiscover(1, filters), loadMyChallenges(), loadRecommended()]);
  };

  const handleJoin = async (challengeId) => {
    await withBusy(`join-${challengeId}`, async () => {
      try {
        await ChallengesAPI.joinChallenge(challengeId);
        setBanner('Challenge joined successfully.');
        await Promise.all([loadMyChallenges(), loadDiscover(page, filters)]);
      } catch (error) {
        setBanner(error?.response?.data?.message || 'Unable to join challenge.');
      }
    });
  };

  const handleLeave = async (challengeId) => {
    await withBusy(`leave-${challengeId}`, async () => {
      try {
        await ChallengesAPI.leaveChallenge(challengeId);
        setBanner('You left the challenge.');
        await Promise.all([loadMyChallenges(), loadDiscover(page, filters)]);
      } catch (error) {
        setBanner(error?.response?.data?.message || 'Unable to leave challenge.');
      }
    });
  };

  const handleProgressUpdate = async (challengeId) => {
    const raw = progressInputs[challengeId];
    const value = Number(raw);

    if (!value || value <= 0) {
      setBanner('Progress must be a positive number.');
      return;
    }

    await withBusy(`progress-${challengeId}`, async () => {
      try {
        await ChallengesAPI.updateProgress(challengeId, value);
        setBanner('Progress updated successfully.');
        setProgressInputs((prev) => ({ ...prev, [challengeId]: '' }));
        await loadMyChallenges();
      } catch (error) {
        setBanner(error?.response?.data?.message || 'Unable to update progress.');
      }
    });
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setBanner('');

    setSubmittingCreate(true);
    try {
      await ChallengesAPI.createChallenge({
        ...createForm,
        emissionTarget: Number(createForm.emissionTarget),
        durationDays: Number(createForm.durationDays),
        rewardPoints: Number(createForm.rewardPoints),
      });
      setBanner('New challenge created successfully.');
      setActiveTab('discover');
      await refreshAll();
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Failed to create challenge.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <UserNavbar userName={user?.name} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="bg-linear-to-r from-emerald-700 to-green-600 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Gamification</p>
            <h1 className="mt-1 text-3xl font-bold">Challenges</h1>
            <p className="mt-2 text-sm text-emerald-100">Join missions, track progress, and reduce emissions.</p>
          </div>

          <div className="border-b border-emerald-100 p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'discover', label: 'Discover' },
                { key: 'my', label: 'My Challenges' },
                { key: 'create', label: 'Create' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    'rounded-full border px-4 py-2 text-sm font-semibold transition',
                    activeTab === tab.key
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {(banner || submitError || discoverError || myError) && (
            <div className="px-4 pt-4 sm:px-6">
              {banner ? <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{banner}</div> : null}
              {submitError ? <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</div> : null}
              {discoverError ? <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{discoverError}</div> : null}
              {myError ? <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{myError}</div> : null}
            </div>
          )}

          {activeTab === 'discover' && (
            <section className="p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <select value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700">
                  <option value="">All Types</option>
                  {TYPE_OPTIONS.map((option) => <option key={option} value={option}>{toLabel(option)}</option>)}
                </select>
                <select value={filters.difficulty} onChange={(event) => setFilters((prev) => ({ ...prev, difficulty: event.target.value }))} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700">
                  <option value="">All Difficulties</option>
                  {DIFFICULTY_OPTIONS.map((option) => <option key={option} value={option}>{toLabel(option)}</option>)}
                </select>
                <select value={filters.transportMode} onChange={(event) => setFilters((prev) => ({ ...prev, transportMode: event.target.value }))} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700">
                  <option value="">All Modes</option>
                  {TRANSPORT_OPTIONS.map((option) => <option key={option} value={option}>{toLabel(option)}</option>)}
                </select>
                <button type="button" onClick={() => { setFilters({ type: '', difficulty: '', transportMode: '' }); setPage(1); }} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Reset Filters</button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
                {discoverLoading ? (
                  <p className="col-span-full rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-8 text-center text-sm text-emerald-900">Loading challenges...</p>
                ) : challenges.length === 0 ? (
                  <p className="col-span-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">No challenges found with current filters.</p>
                ) : (
                  challenges.map((challenge) => {
                    const challengeId = String(challenge._id);
                    const joined = joinedChallengeIds.has(challengeId);
                    const joining = busyMap[`join-${challengeId}`];

                    return (
                      <ChallengeCard
                        key={challengeId}
                        challenge={challenge}
                        actionSlot={
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              disabled={joined || joining}
                              onClick={() => handleJoin(challengeId)}
                              className={[
                                'rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                                joined ? 'cursor-not-allowed bg-gray-100 text-gray-500' : 'bg-emerald-600 text-white hover:bg-emerald-700',
                              ].join(' ')}
                            >
                              {joined ? 'Already Joined' : joining ? 'Joining...' : 'Join Challenge'}
                            </button>
                            <button type="button" onClick={() => navigate(`/challenges/${challengeId}`)} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">View Details</button>
                          </div>
                        }
                      />
                    );
                  })
                )}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button type="button" disabled={page <= 1 || discoverLoading} onClick={() => loadDiscover(page - 1, filters)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                <p className="text-sm text-gray-600">Page {page} of {pages}</p>
                <button type="button" disabled={page >= pages || discoverLoading} onClick={() => loadDiscover(page + 1, filters)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </div>

              <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-emerald-900">Recommended Challenges</h2>
                  <button type="button" onClick={loadRecommended} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">Refresh</button>
                </div>
                {recommendedLoading ? (
                  <p className="text-sm text-emerald-800">Loading recommended list...</p>
                ) : recommended.length === 0 ? (
                  <p className="text-sm text-emerald-800">No recommendations yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {recommended.map((challenge) => (
                      <div key={challenge._id} className="rounded-xl border border-emerald-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{toLabel(challenge.transportMode)}</p>
                        <h3 className="mt-1 text-base font-bold text-emerald-950">{challenge.title}</h3>
                        <p className="mt-2 text-sm text-gray-700 line-clamp-2">{challenge.description}</p>
                        <button type="button" onClick={() => navigate(`/challenges/${challenge._id}`)} className="mt-3 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Open Details</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'my' && (
            <section className="p-4 sm:p-6">
              {myLoading ? (
                <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-8 text-center text-sm text-emerald-900">Loading your challenges...</p>
              ) : myChallenges.length === 0 ? (
                <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">You have not joined any active challenges yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {myChallenges.map((row) => {
                    const challenge = row.challenge || {};
                    const challengeId = String(challenge._id || row.challenge);
                    const progress = Number(row.progress || 0);
                    const target = Number(challenge.emissionTarget || 0);
                    const progressPercent = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;

                    return (
                      <ChallengeCard
                        key={row._id || challengeId}
                        challenge={challenge}
                        footerSlot={
                          <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-semibold text-gray-800">Progress</span>
                              <span className="font-semibold text-emerald-800">{prettyNumber(progress)} / {prettyNumber(target)} kg CO2</span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                              <div className="h-full rounded-full bg-linear-to-r from-emerald-500 to-green-600" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-emerald-700">{progressPercent}% complete</p>
                          </div>
                        }
                        actionSlot={
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                            <input
                              value={progressInputs[challengeId] ?? ''}
                              onChange={(event) => setProgressInputs((prev) => ({ ...prev, [challengeId]: event.target.value }))}
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="Add progress (kg CO2)"
                              className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                            />
                            <button type="button" disabled={busyMap[`progress-${challengeId}`]} onClick={() => handleProgressUpdate(challengeId)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{busyMap[`progress-${challengeId}`] ? 'Saving...' : 'Update'}</button>
                            <button type="button" disabled={busyMap[`leave-${challengeId}`]} onClick={() => handleLeave(challengeId)} className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">{busyMap[`leave-${challengeId}`] ? 'Leaving...' : 'Leave'}</button>
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab === 'create' && (
            <section className="p-4 sm:p-6">
              <form onSubmit={handleCreateSubmit} className="mx-auto max-w-3xl rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-emerald-950">Create New Challenge</h2>
                <p className="mt-1 text-sm text-emerald-800">This uses the existing backend generation flow and validation rules.</p>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">
                    Transport Mode
                    <select required value={createForm.transportMode} onChange={(event) => setCreateForm((prev) => ({ ...prev, transportMode: event.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5">
                      {TRANSPORT_OPTIONS.map((option) => <option key={option} value={option}>{toLabel(option)}</option>)}
                    </select>
                  </label>

                  <label className="text-sm font-medium text-gray-700">
                    Difficulty
                    <select required value={createForm.difficulty} onChange={(event) => setCreateForm((prev) => ({ ...prev, difficulty: event.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5">
                      {DIFFICULTY_OPTIONS.map((option) => <option key={option} value={option}>{toLabel(option)}</option>)}
                    </select>
                  </label>

                  <label className="text-sm font-medium text-gray-700">
                    Type
                    <select required value={createForm.type} onChange={(event) => setCreateForm((prev) => ({ ...prev, type: event.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5">
                      {TYPE_OPTIONS.map((option) => <option key={option} value={option}>{toLabel(option)}</option>)}
                    </select>
                  </label>

                  <label className="text-sm font-medium text-gray-700">
                    Emission Target (kg CO2)
                    <input required min="0.1" step="0.1" type="number" value={createForm.emissionTarget} onChange={(event) => setCreateForm((prev) => ({ ...prev, emissionTarget: event.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5" />
                  </label>

                  <label className="text-sm font-medium text-gray-700">
                    Duration (days)
                    <input required min="1" step="1" type="number" value={createForm.durationDays} onChange={(event) => setCreateForm((prev) => ({ ...prev, durationDays: event.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5" />
                  </label>

                  <label className="text-sm font-medium text-gray-700">
                    Reward Points
                    <input required min="1" step="1" type="number" value={createForm.rewardPoints} onChange={(event) => setCreateForm((prev) => ({ ...prev, rewardPoints: event.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5" />
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button type="submit" disabled={submittingCreate} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{submittingCreate ? 'Creating...' : 'Create Challenge'}</button>
                  <button type="button" onClick={() => setCreateForm({ transportMode: 'BIKE', emissionTarget: 5, durationDays: 7, difficulty: 'EASY', type: 'INDIVIDUAL', rewardPoints: 100 })} className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Reset</button>
                </div>
              </form>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Challenges;
