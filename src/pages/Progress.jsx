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
import {
  formatSetPerformance,
  getCompletedSetCountFromExercises,
  getSetExternalVolume,
  getSessionExternalVolume,
  isAssistedResistance,
  isBodyweightResistance,
  toWorkoutNumber,
} from "../utils/workoutMetrics";

const HISTORY_LIMIT = 100;

function getSessionVolume(session) {
  return getSessionExternalVolume(session.exercises);
}

function getCompletedSetCount(session) {
  return getCompletedSetCountFromExercises(session.exercises);
}

function getBestSet(session) {
  return session.exercises.reduce((bestSet, exercise) => {
    const exerciseBest = exercise.sets.reduce(
      (currentBest, set) => {
        const volume = getSetExternalVolume(set);

        if (volume > currentBest.volume) {
          return {
            exerciseName: exercise.exerciseName,
            label: formatSetPerformance(set),
            weight: toWorkoutNumber(set.weight),
            reps: toWorkoutNumber(set.reps),
            volume,
          };
        }

        return currentBest;
      },
      {
        exerciseName: "",
        label: "",
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
    label: "",
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

function getTrendMetricLabel(session) {
  if (session.metricType === "reps") {
    return "Reps";
  }

  if (session.metricType === "assistance") {
    return "Best assistance";
  }

  return "External volume";
}

function getTrendMetricValue(session) {
  if (session.metricType === "reps") {
    return `${formatNumber(session.totalReps)} reps`;
  }

  if (session.metricType === "assistance") {
    return session.bestAssistance > 0
      ? `${formatNumber(session.bestAssistance)} lb`
      : "—";
  }

  return `${formatNumber(session.volume)} lb`;
}

function getTrendChange(exercise) {
  if (!exercise.previous) {
    return {
      value: "New",
      isPositive: true,
    };
  }

  if (exercise.latest.metricType === "reps") {
    return {
      value: `${exercise.repChange >= 0 ? "+" : ""}${formatNumber(
        exercise.repChange,
      )} reps`,
      isPositive: exercise.repChange >= 0,
    };
  }

  if (exercise.latest.metricType === "assistance") {
    return {
      value: `${
        exercise.assistanceChange >= 0 ? "+" : ""
      }${formatNumber(exercise.assistanceChange)} lb`,
      isPositive: exercise.assistanceChange <= 0,
    };
  }

  return {
    value: `${exercise.volumeChange >= 0 ? "+" : ""}${formatNumber(
      exercise.volumeChange,
    )} lb`,
    isPositive: exercise.volumeChange >= 0,
  };
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
        (total, set) => total + getSetExternalVolume(set),
        0,
      );
      const totalReps = exercise.sets.reduce(
        (total, set) => total + toWorkoutNumber(set.reps),
        0,
      );
      const bestWeight = exercise.sets.reduce(
        (best, set) =>
          Math.max(best, toWorkoutNumber(set.weight)),
        0,
      );
      const bestAssistance = exercise.sets.reduce(
        (best, set) =>
          isAssistedResistance(set.resistanceType) &&
          toWorkoutNumber(set.weight) > 0
            ? Math.min(best, toWorkoutNumber(set.weight))
            : best,
        Number.POSITIVE_INFINITY,
      );
      const hasBodyweightSets = exercise.sets.some((set) =>
        isBodyweightResistance(set.resistanceType),
      );
      const hasAssistedSets = exercise.sets.some((set) =>
        isAssistedResistance(set.resistanceType),
      );
      const totalSets = exercise.sets.filter(
        (set) =>
          toWorkoutNumber(set.weight) > 0 ||
          toWorkoutNumber(set.reps) > 0,
      ).length;

      if (volume > 0 || totalReps > 0 || totalSets > 0) {
        existing.sessions.push({
          date: session.date,
          workoutName: session.workoutName,
          volume,
          totalReps,
          bestWeight,
          bestAssistance:
            bestAssistance === Number.POSITIVE_INFINITY
              ? 0
              : bestAssistance,
          metricType: hasBodyweightSets
            ? "reps"
            : hasAssistedSets
              ? "assistance"
              : "volume",
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
        repChange:
          latest && previous
            ? latest.totalReps - previous.totalReps
            : 0,
        assistanceChange:
          latest && previous
            ? latest.bestAssistance - previous.bestAssistance
            : 0,
      };
    })
    .filter((exercise) => exercise.latest)
    .sort((first, second) => {
      const firstScore =
        first.latest.metricType === "reps"
          ? Math.abs(first.repChange)
          : Math.abs(first.volumeChange);
      const secondScore =
        second.latest.metricType === "reps"
          ? Math.abs(second.repChange)
          : Math.abs(second.volumeChange);

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
            your weekly external volume, sets, and exercise
            trends.
          </p>
        </section>
      ) : null}

      {user && sessions.length > 0 ? (
        <>
          <section className="progress-summary-grid">
            <article className="progress-card progress-card--accent">
              <div className="progress-card__header">
                <span>This week external volume</span>
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
                  ? analytics.currentWeek.bestSet.label
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
                <h2>External volume this week vs last week</h2>
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
                      <span>
                        {getTrendMetricLabel(exercise.latest)}
                      </span>
                      <strong>
                        {getTrendMetricValue(exercise.latest)}
                      </strong>
                    </div>

                    <div>
                      <span>Change</span>
                      {(() => {
                        const change = getTrendChange(exercise);

                        return (
                          <strong
                            className={
                              change.isPositive
                                ? "progress-text-positive"
                                : "progress-text-negative"
                            }
                          >
                            {change.value}
                          </strong>
                        );
                      })()}
                    </div>

                    <div>
                      <span>
                        {exercise.latest.metricType === "assistance"
                          ? "Lower is better"
                          : "Best weight"}
                      </span>
                      <strong>
                        {exercise.latest.metricType === "assistance"
                          ? "Assisted"
                          : `${formatNumber(
                              exercise.latest.bestWeight,
                            )} lb`}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="progress-panel__empty">
                Exercise trends will appear after you save a few
                workouts.
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
                      lb external volume
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
