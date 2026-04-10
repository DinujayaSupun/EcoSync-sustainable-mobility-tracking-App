import { useRef, useState } from 'react';

export default function AchievementPanel({ achievements, title = 'Achievement Unlocked', onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);

  if (!achievements?.hasAny && !achievements?.progressedChallenges?.length) {
    return null;
  }

  const handleClose = () => {
    if (!onClose || isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, 180);
  };

  return (
    <div
      className={[
        'space-y-3 rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 via-white to-yellow-50 p-4 shadow-sm transition-all duration-200 sm:p-5',
        isClosing ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-amber-900">
          <span className="material-icons" style={{ fontSize: '22px' }}>emoji_events</span>
          {title}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-amber-300 bg-white px-2 py-1 text-amber-700 transition hover:bg-amber-100"
            aria-label="Close achievement panel"
            title="Close"
            disabled={isClosing}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
          </button>
        )}
      </div>

      {achievements.newBadges?.length > 0 && (
        <div className="space-y-2">
          {achievements.newBadges.map((badge) => (
            <div
              key={badge._id}
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-white px-3 py-3"
            >
              {badge.imageUrl ? (
                <img
                  src={badge.imageUrl}
                  alt={badge.name}
                  className="h-11 w-11 rounded-full border border-amber-300 object-cover"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <span className="material-icons" style={{ fontSize: '22px' }}>workspace_premium</span>
                </span>
              )}
              <div>
                <p className="text-sm font-bold text-amber-900">New Badge Earned: {badge.name}</p>
                <p className="text-xs text-amber-700">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {achievements.completedChallenges?.length > 0 && (
        <div className="space-y-2">
          {achievements.completedChallenges.map((challenge) => (
            <div
              key={challenge._id}
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-3 py-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <span className="material-icons" style={{ fontSize: '22px' }}>
                  {challenge.icon || 'military_tech'}
                </span>
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-900">Challenge Completed: {challenge.title}</p>
                <p className="text-xs text-emerald-700">Reward: +{challenge.rewardPoints} points</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {achievements.progressedChallenges?.length > 0 && (
        <div className="space-y-2">
          {achievements.progressedChallenges.map((challenge) => (
            <div
              key={`${challenge._id}-progress`}
              className="flex items-center gap-3 rounded-xl border border-cyan-200 bg-white px-3 py-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                <span className="material-icons" style={{ fontSize: '22px' }}>
                  {challenge.icon || 'trending_up'}
                </span>
              </span>
              <div>
                <p className="text-sm font-bold text-cyan-900">Challenge Progress: {challenge.title}</p>
                <p className="text-xs text-cyan-700">
                  +{Number(challenge.increment || 0).toFixed(2)} kg CO2 saved
                  ({Number(challenge.progressAfter || 0).toFixed(2)}/{Number(challenge.emissionTarget || 0).toFixed(2)})
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}