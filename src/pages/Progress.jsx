import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Cloud,
  Download,
  Dumbbell,
  LoaderCircle,
  LogIn,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
const TREND_WEEKS = 5;

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

function formatShortDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
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

function getWeeklyVolumeTrend(sessions, weekCount = TREND_WEEKS) {
  const currentWeekStart = getWeekStart(new Date());

  if (!currentWeekStart) {
    return [];
  }

  return Array.from({ length: weekCount }, (_, index) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(
      currentWeekStart.getDate() -
        (weekCount - 1 - index) * 7,
    );

    const weekKey = getWeekKey(weekStart);
    const weekSessions = sessions.filter(
      (session) => getWeekKey(session.date) === weekKey,
    );

    return {
      week: formatShortDate(weekStart),
      weekKey,
      volume: weekSessions.reduce(
        (total, session) => total + getSessionVolume(session),
        0,
      ),
    };
  });
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

function getExportDateKey(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function downloadJsonFile({ fileName, data }) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

function getTrendBestLabel(exercise) {
  if (exercise.latest.metricType === "assistance") {
    return "Best assistance";
  }

  if (exercise.latest.metricType === "reps") {
    return "Best reps";
  }

  return "Best weight";
}

function getTrendBestValue(exercise) {
  if (exercise.latest.metricType === "assistance") {
    return exercise.latest.bestAssistance > 0
      ? `${formatNumber(exercise.latest.bestAssistance)} lb`
      : "—";
  }

  if (exercise.latest.metricType === "reps") {
    return `${formatNumber(exercise.latest.totalReps)} reps`;
  }

  return exercise.latest.bestWeight > 0
    ? `${formatNumber(exercise.latest.bestWeight)} lb`
    : "—";
}

function StatCard({ label, value, delta, deltaLabel, Icon }) {
  const isPositive = delta >= 0;
  const DeltaIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <article className="progress-stat-card">
      <div className="progress-stat-card__header">
        <span>{label}</span>
        <Icon size={18} />
      </div>

      <strong>{value}</strong>

      <span
        className={`progress-stat-card__delta ${
          isPositive
            ? "progress-stat-card__delta--positive"
            : "progress-stat-card__delta--negative"
        }`}
      >
        <DeltaIcon size={13} />
        {deltaLabel}
      </span>
    </article>
  );
}

function VolumeTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 12, right: 12, bottom: 0, left: -18 }}
      >
        <XAxis
          axisLine={false}
          dataKey="week"
          fontSize={11}
          stroke="rgba(151, 161, 179, 0.85)"
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          fontSize={11}
          stroke="rgba(151, 161, 179, 0.85)"
          tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#101419",
            border: "1px solid #2a323d",
            borderRadius: 10,
            color: "#f7f8fb",
            fontSize: 12,
          }}
          formatter={(value) => [
            `${formatNumber(value)} lb`,
            "Volume",
          ]}
          labelStyle={{ color: "#f7f8fb" }}
        />
        <Line
          dataKey="volume"
          dot={{ r: 4, fill: "#b7f34a" }}
          stroke="#b7f34a"
          strokeLinecap="round"
          strokeWidth={3}
          type="monotone"
        />
      </LineChart>
    </ResponsiveContainer>
  );
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
      sessionChange:
        currentWeek.sessions - previousWeek.sessions,
      setChange: currentWeek.totalSets - previousWeek.totalSets,
      weeklyVolumeTrend: getWeeklyVolumeTrend(sessions),
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

  function handleDownloadWorkoutData() {
    const exportedAt = new Date();

    downloadJsonFile({
      fileName: `fitcircle-workout-data-${getExportDateKey(
        exportedAt,
      )}.json`,
      data: {
        exportedAt: exportedAt.toISOString(),
        source: "FitCircle",
        formatVersion: 1,
        sessionCount: sessions.length,
        analytics: {
          currentWeek: {
            weekStart: analytics.currentWeekKey,
            weekRange: getWeekRangeLabel(
              analytics.currentWeekKey,
            ),
            totalVolume:
              analytics.currentWeek.totalVolume,
            totalSets: analytics.currentWeek.totalSets,
            sessions: analytics.currentWeek.sessions,
            bestSet: analytics.currentWeek.bestSet,
          },
          previousWeek: {
            weekStart: analytics.previousWeekKey,
            weekRange: getWeekRangeLabel(
              analytics.previousWeekKey,
            ),
            totalVolume:
              analytics.previousWeek.totalVolume,
            totalSets: analytics.previousWeek.totalSets,
            sessions: analytics.previousWeek.sessions,
            bestSet: analytics.previousWeek.bestSet,
          },
          volumeChange: analytics.volumeChange,
          volumePercentChange:
            analytics.volumePercentChange,
          exerciseTrends: analytics.exerciseTrends,
        },
        sessions,
      },
    });
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

        {user && (
          <button
            type="button"
            className="secondary-button progress-page__export"
            disabled={isLoadingHistory || sessions.length === 0}
            onClick={handleDownloadWorkoutData}
          >
            <Download size={17} />
            Download data
          </button>
        )}
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
            <StatCard
              delta={analytics.volumePercentChange}
              deltaLabel={`${formatPercent(
                analytics.volumePercentChange,
              )} vs last week`}
              Icon={BarChart3}
              label="This week volume"
              value={`${formatNumber(
                analytics.currentWeek.totalVolume,
              )} lb`}
            />

            <StatCard
              delta={analytics.sessionChange}
              deltaLabel={`${
                analytics.sessionChange >= 0 ? "+" : ""
              }${analytics.sessionChange} vs last week`}
              Icon={CalendarDays}
              label="Sessions"
              value={analytics.currentWeek.sessions}
            />

            <StatCard
              delta={analytics.setChange}
              deltaLabel={`${
                analytics.setChange >= 0 ? "+" : ""
              }${analytics.setChange} vs last week`}
              Icon={Dumbbell}
              label="Sets logged"
              value={analytics.currentWeek.totalSets}
            />

            <StatCard
              delta={analytics.currentWeek.bestSet.volume > 0 ? 1 : 0}
              deltaLabel={
                analytics.currentWeek.bestSet.exerciseName ||
                "Log a weighted set"
              }
              Icon={Trophy}
              label="Best set"
              value={
                analytics.currentWeek.bestSet.volume > 0
                  ? analytics.currentWeek.bestSet.label
                  : "Not yet"
              }
            />
          </section>

          <section className="progress-panel">
            <div className="progress-panel__heading">
              <div>
                <h2>Weekly volume trend</h2>
                <p>
                  Last {TREND_WEEKS} weeks of saved external
                  training volume.
                </p>
              </div>

              <span className="progress-panel__range">
                {getWeekRangeLabel(analytics.currentWeekKey)}
              </span>
            </div>

            <div className="progress-volume-chart">
              <VolumeTrendChart data={analytics.weeklyVolumeTrend} />
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
                    className={`progress-trend ${
                      getTrendChange(exercise).isPositive
                        ? "progress-trend--positive"
                        : ""
                    }`}
                    key={exercise.exerciseId}
                  >
                    <div className="progress-trend__identity">
                      {getTrendChange(exercise).isPositive ? (
                        <span className="progress-trend__pr">
                          <Trophy size={14} />
                        </span>
                      ) : null}

                      <div>
                        <strong>{exercise.exerciseName}</strong>
                        <span>
                          Last trained{" "}
                          {formatDate(exercise.latest.date)}
                        </span>
                      </div>
                    </div>

                    <div className="progress-trend__metric">
                      <span>
                        {getTrendMetricLabel(exercise.latest)}
                      </span>
                      <strong>
                        {getTrendMetricValue(exercise.latest)}
                      </strong>
                    </div>

                    <div className="progress-trend__metric">
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

                    <div className="progress-trend__metric">
                      <span>{getTrendBestLabel(exercise)}</span>
                      <strong>
                        {getTrendBestValue(exercise)}
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
                <button
                  type="button"
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
                      lb · {getCompletedSetCount(session)} sets
                    </span>
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default Progress;
