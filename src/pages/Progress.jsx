import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Cloud,
  Dumbbell,
  LoaderCircle,
  LogIn,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/useAuth";
import { getUserWorkoutHistory } from "../services/workouts";
import { formatDate } from "../utils/date";

const HISTORY_LIMIT = 100;

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getSetVolume(set) {
  return toNumber(set.weight) * toNumber(set.reps);
}

function getSessionVolume(session) {
  return session.exercises.reduce(
    (sessionTotal, exercise) =>
      sessionTotal +
      exercise.sets.reduce(
        (exerciseTotal, set) =>
          exerciseTotal + getSetVolume(set),
        0,
      ),
    0,
  );
}

function getCompletedSetCount(session) {
  return session.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.filter(
        (set) =>
          toNumber(set.weight) > 0 || toNumber(set.reps) > 0,
      ).length,
    0,
  );
}

function getBestSet(session) {
  return session.exercises.reduce((bestSet, exercise) => {
    const exerciseBest = exercise.sets.reduce(
      (currentBest, set) => {
        const volume = getSetVolume(set);

        if (volume > currentBest.volume) {
          return {
            exerciseName: exercise.exerciseName,
            weight: toNumber(set.weight),
            reps: toNumber(set.reps),
            volume,
          };
        }

        return currentBest;
      },
      {
        exerciseName: "",
        weight: 0,
        reps: 0,
        volume: 0,
      },
    );

    return exerciseBest.volume > bestSet.volume
      ? exerciseBest
      : bestSet;
  }, {
    exerciseName: "",
    weight: 0,
    reps: 0,
    volume: 0,
  });
}

function getWeekStart(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + mondayOffset);

  return date;
}

function getWeekKey(value) {
  const weekStart = getWeekStart(value);

  if (!weekStart) {
    return "";
  }

  const year = weekStart.getFullYear();
  const month = String(weekStart.getMonth() + 1).padStart(
    2,
    "0",
  );
  const day = String(weekStart.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekRangeLabel(weekKey) {
  if (!weekKey) {
    return "Unknown week";
  }

  const start = new Date(`${weekKey}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${formatDate(start)} - ${formatDate(end)}`;
}

function summarizeSessions(sessions) {
  const totalVolume = sessions.reduce(
    (total, session) => total + getSessionVolume(session),
    0,
  );
  const totalSets = sessions.reduce(
    (total, session) => total + getCompletedSetCount(session),
    0,
  );

  return {
    totalVolume,
    totalSets,
    sessions: sessions.length,
    bestSet: sessions.reduce((bestSet, session) => {
      const sessionBest = getBestSet(session);

      return sessionBest.volume > bestSet.volume
        ? sessionBest
        : bestSet;
    }, getBestSet({ exercises: [] })),
  };
}

function getPercentChange(current, previous) {
  if (!previous) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString();
}

function formatPercent(value) {
  const rounded = Math.round(value * 10) / 10;

  if (rounded > 0) {
    return `+${rounded}%`;
  }

  return `${rounded}%`;
}

function getExerciseTrends(sessions) {
  const exerciseMap = new Map();

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const existing = exerciseMap.get(exercise.exerciseId) ?? {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        sessions: [],
      };

      const volume = exercise.sets.reduce(
        (total, set) => total + getSetVolume(set),
        0,
      );
      const bestWeight = exercise.sets.reduce(
        (best, set) => Math.max(best, toNumber(set.weight)),
        0,
      );
      const totalSets = exercise.sets.filter(
        (set) =>
          toNumber(set.weight) > 0 || toNumber(set.reps) > 0,
      ).length;

      if (volume > 0 || totalSets > 0) {
        existing.sessions.push({
          date: session.date,
          workoutName: session.workoutName,
          volume,
          bestWeight,
          totalSets,
        });
      }

      exerciseMap.set(exercise.exerciseId, existing);
    }
  }

  return Array.from(exerciseMap.values())
    .map((exercise) => {
      const [latest, previous] = exercise.sessions.sort(
        (first, second) =>
          new Date(second.date) - new Date(first.date),
      );

      return {
        ...exercise,
        latest,
        previous,
        volumeChange:
          latest && previous
            ? latest.volume - previous.volume
            : 0,
        bestWeightChange:
          latest && previous
            ? latest.bestWeight - previous.bestWeight
            : 0,
      };
    })
    .filter((exercise) => exercise.latest)
    .sort((first, second) => {
      const firstScore = Math.abs(first.volumeChange);
      const secondScore = Math.abs(second.volumeChange);

      return secondScore - firstScore;
    })
    .slice(0, 8);
}

function Progress() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadProgress() {
      if (!user) {
        setSessions([]);
        return;
      }

      setIsLoadingHistory(true);
      setErrorMessage("");

      try {
        const history = await getUserWorkoutHistory({
          userId: user.id,
          limit: HISTORY_LIMIT,
        });

        if (isCurrent) {
          setSessions(history);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(error.message);
        }
      } finally {
        if (isCurrent) {
          setIsLoadingHistory(false);
        }
      }
    }

    loadProgress();

    return () => {
      isCurrent = false;
    };
  }, [user]);

  const analytics = useMemo(() => {
    const currentWeekKey = getWeekKey(new Date());
    const previousWeekDate = getWeekStart(new Date());
    previousWeekDate?.setDate(previousWeekDate.getDate() - 7);
    const previousWeekKey = previousWeekDate
      ? getWeekKey(previousWeekDate)
      : "";

    const currentWeekSessions = sessions.filter(
      (session) => getWeekKey(session.date) === currentWeekKey,
    );
    const previousWeekSessions = sessions.filter(
      (session) => getWeekKey(session.date) === previousWeekKey,
    );

    const currentWeek = summarizeSessions(
      currentWeekSessions,
    );
    const previousWeek = summarizeSessions(
      previousWeekSessions,
    );

    return {
      currentWeekKey,
      previousWeekKey,
      currentWeek,
      previousWeek,
      volumeChange:
        currentWeek.totalVolume - previousWeek.totalVolume,
      volumePercentChange: getPercentChange(
        currentWeek.totalVolume,
        previousWeek.totalVolume,
      ),
      exerciseTrends: getExerciseTrends(sessions),
      recentSessions: sessions.slice(0, 5),
    };
  }, [sessions]);

  async function handleSignIn() {
    try {
      setErrorMessage("");
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <div className="page progress-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Progress</h1>
          <p>
            See how this week compares against your recent
            training history.
          </p>
        </div>
      </section>

      {!isLoading && !user ? (
        <section className="auth-required-card">
          <div>
            <Cloud size={22} />
          </div>

          <div>
            <strong>Sign in to view progress</strong>
            <p>
              Your analytics are calculated from saved workout
              sessions.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleSignIn}
          >
            <LogIn size={17} />
            Continue with Google
          </button>
        </section>
      ) : null}

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      {isLoadingHistory ? (
        <div className="history-loading">
          <LoaderCircle className="spin" size={18} />
          Loading progress analytics...
        </div>
      ) : null}

      {user && !isLoadingHistory && sessions.length === 0 ? (
        <section className="empty-state progress-page__empty">
          <Activity size={38} />
          <h2>No workout data yet</h2>
          <p>
            Save a few workouts and this page will compare
            your weekly volume, sets, and exercise trends.
          </p>
        </section>
      ) : null}

      {user && sessions.length > 0 ? (
        <>
          <section className="progress-summary-grid">
            <article className="progress-card progress-card--accent">
              <div className="progress-card__header">
                <span>This week volume</span>
                <BarChart3 size={20} />
              </div>

              <strong>
                {formatNumber(
                  analytics.currentWeek.totalVolume,
                )}{" "}
                lb
              </strong>

              <p>
                {formatPercent(
                  analytics.volumePercentChange,
                )}{" "}
                vs last week
              </p>
            </article>

            <article className="progress-card">
              <div className="progress-card__header">
                <span>Sessions completed</span>
                <CalendarDays size={20} />
              </div>

              <strong>
                {analytics.currentWeek.sessions}
              </strong>

              <p>
                {analytics.previousWeek.sessions} last week
              </p>
            </article>

            <article className="progress-card">
              <div className="progress-card__header">
                <span>Sets logged</span>
                <Dumbbell size={20} />
              </div>

              <strong>{analytics.currentWeek.totalSets}</strong>

              <p>
                {analytics.previousWeek.totalSets} last week
              </p>
            </article>

            <article className="progress-card">
              <div className="progress-card__header">
                <span>Best set this week</span>
                <Trophy size={20} />
              </div>

              <strong>
                {analytics.currentWeek.bestSet.volume > 0
                  ? `${analytics.currentWeek.bestSet.weight} x ${analytics.currentWeek.bestSet.reps}`
                  : "Not yet"}
              </strong>

              <p>
                {analytics.currentWeek.bestSet.exerciseName ||
                  "Log a weighted set"}
              </p>
            </article>
          </section>

          <section className="progress-panel">
            <div className="progress-panel__heading">
              <div>
                <h2>This week vs last week</h2>
                <p>
                  {getWeekRangeLabel(
                    analytics.currentWeekKey,
                  )}{" "}
                  compared with{" "}
                  {getWeekRangeLabel(
                    analytics.previousWeekKey,
                  )}
                </p>
              </div>

              <span
                className={`progress-delta ${
                  analytics.volumeChange >= 0
                    ? "progress-delta--positive"
                    : "progress-delta--negative"
                }`}
              >
                <ArrowUpRight size={16} />
                {analytics.volumeChange >= 0 ? "+" : ""}
                {formatNumber(analytics.volumeChange)} lb
              </span>
            </div>

            <div className="progress-comparison">
              <div>
                <span>Current week</span>
                <strong>
                  {formatNumber(
                    analytics.currentWeek.totalVolume,
                  )}{" "}
                  lb
                </strong>
              </div>

              <div>
                <span>Previous week</span>
                <strong>
                  {formatNumber(
                    analytics.previousWeek.totalVolume,
                  )}{" "}
                  lb
                </strong>
              </div>
            </div>
          </section>

          <section className="progress-panel">
            <div className="progress-panel__heading">
              <div>
                <h2>Exercise trends</h2>
                <p>
                  Latest logged session compared with the
                  previous time you trained that exercise.
                </p>
              </div>
            </div>

            {analytics.exerciseTrends.length > 0 ? (
              <div className="progress-trend-list">
                {analytics.exerciseTrends.map((exercise) => (
                  <article
                    className="progress-trend"
                    key={exercise.exerciseId}
                  >
                    <div>
                      <strong>{exercise.exerciseName}</strong>
                      <span>
                        Last trained{" "}
                        {formatDate(exercise.latest.date)}
                      </span>
                    </div>

                    <div>
                      <span>Volume</span>
                      <strong>
                        {formatNumber(exercise.latest.volume)}{" "}
                        lb
                      </strong>
                    </div>

                    <div>
                      <span>Change</span>
                      <strong
                        className={
                          exercise.volumeChange >= 0
                            ? "progress-text-positive"
                            : "progress-text-negative"
                        }
                      >
                        {exercise.previous
                          ? `${
                              exercise.volumeChange >= 0
                                ? "+"
                                : ""
                            }${formatNumber(
                              exercise.volumeChange,
                            )} lb`
                          : "New"}
                      </strong>
                    </div>

                    <div>
                      <span>Best weight</span>
                      <strong>
                        {formatNumber(
                          exercise.latest.bestWeight,
                        )}{" "}
                        lb
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="progress-panel__empty">
                Weighted exercise trends will appear after you
                save strength workouts.
              </p>
            )}
          </section>

          <section className="progress-panel">
            <div className="progress-panel__heading">
              <div>
                <h2>Recent sessions</h2>
                <p>
                  The latest saved workouts feeding these
                  calculations.
                </p>
              </div>
            </div>

            <div className="progress-session-list">
              {analytics.recentSessions.map((session) => (
                <div
                  className="progress-session"
                  key={session.id}
                >
                  <div>
                    <strong>{session.workoutName}</strong>
                    <span>{formatDate(session.date)}</span>
                  </div>

                  <div>
                    <span>
                      {formatNumber(getSessionVolume(session))}{" "}
                      lb volume
                    </span>
                    <span>
                      {getCompletedSetCount(session)} sets
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default Progress;
