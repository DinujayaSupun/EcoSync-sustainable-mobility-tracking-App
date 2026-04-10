import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '../components/common/Footer';
import UserNavbar from '../components/common/UserNavbar';
import { AuthContext } from '../context/AuthContext';
import { ChallengesAPI } from '../api/challenges.api';

const toLabel = (value) => {
  if (!value) return '-';
  return String(value)
    .toLowerCase()
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

export default function ChallengeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [challenge, setChallenge] = useState(null);
  const [myChallenges, setMyChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const [progressInput, setProgressInput] = useState('');

  const participation = useMemo(
    () => myChallenges.find((row) => String(row?.challenge?._id || row?.challenge) === String(id)),
    [myChallenges, id],
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [challengeData, myRows] = await Promise.all([
        ChallengesAPI.getChallengeById(id),
        ChallengesAPI.getMyChallenges(),
      ]);
      setChallenge(challengeData);
      setMyChallenges(myRows || []);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Failed to load challenge details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleJoin = async () => {
    setBusy(true);
    setBanner('');
    try {
      await ChallengesAPI.joinChallenge(id);
      setBanner('Challenge joined successfully.');
      await loadData();
    } catch (joinError) {
      setBanner(joinError?.response?.data?.message || 'Unable to join challenge.');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    setBanner('');
    try {
      await ChallengesAPI.leaveChallenge(id);
      setBanner('You left this challenge.');
      await loadData();
    } catch (leaveError) {
      setBanner(leaveError?.response?.data?.message || 'Unable to leave challenge.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateProgress = async () => {
    const value = Number(progressInput);
    if (!value || value <= 0) {
      setBanner('Progress must be a positive value.');
      return;
    }

    setBusy(true);
    setBanner('');
    try {
      await ChallengesAPI.updateProgress(id, value);
      setProgressInput('');
      setBanner('Progress updated successfully.');
      await loadData();
    } catch (updateError) {
      setBanner(updateError?.response?.data?.message || 'Unable to update progress.');
    } finally {
      setBusy(false);
    }
  };

  const progress = Number(participation?.progress || 0);
  const target = Number(challenge?.emissionTarget || 0);
  const progressPercent = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <UserNavbar userName={user?.name} onLogout={handleLogout} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <button
          type="button"
          onClick={() => navigate('/challenges')}
          className="mb-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back to Challenges
        </button>

        {loading ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">Loading challenge details...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : challenge ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              {toLabel(challenge.type)}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-emerald-950">{challenge.title}</h1>
            <p className="mt-2 text-gray-700">{challenge.description}</p>

            {challenge.tagline ? (
              <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
                {challenge.tagline}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Transport</p>
                <p className="font-semibold text-gray-900">{toLabel(challenge.transportMode)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Difficulty</p>
                <p className="font-semibold text-gray-900">{toLabel(challenge.difficulty)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-semibold text-gray-900">{toLabel(challenge.status)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Target</p>
                <p className="font-semibold text-gray-900">{challenge.emissionTarget} kg CO2</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-semibold text-gray-900">{challenge.durationDays} days</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Deadline</p>
                <p className="font-semibold text-gray-900">{formatDate(challenge.deadline)}</p>
              </div>
            </div>

            {banner ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {banner}
              </div>
            ) : null}

            {!participation ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleJoin}
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? 'Joining...' : 'Join Challenge'}
              </button>
            ) : (
              <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="mb-2 text-sm font-semibold text-emerald-900">Your Progress</p>
                <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-emerald-500 to-green-600"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-emerald-800">{progress} / {target} kg CO2 ({progressPercent}%)</p>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={progressInput}
                    onChange={(event) => setProgressInput(event.target.value)}
                    placeholder="Add progress"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleUpdateProgress}
                    disabled={busy}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={busy}
                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Leave
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
