import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  LoaderCircle,
  Nut,
  Pencil,
  Pizza,
  Save,
  Scale,
  Salad,
  Leaf,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  defaultWorkoutSchedule,
  getTodayWorkoutKey,
  normalizeWorkoutSchedule,
  workoutProgram,
} from "../data/workoutProgram";
import {
  getCurrentUserProfile,
  updateCurrentWeight,
} from "../services/profile";
import { getUserWorkoutHistory } from "../services/workouts";
import {
  defaultNutritionTargets,
  getNutritionDay,
  getTodayKey,
} from "../services/nutrition";

function getTimeBasedGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getWeekStart(value = new Date()) {
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

function getDateKey(value = new Date()) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return getTodayKey();
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10);
}

function getWeekdayKeyFromDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const dayMap = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };

  return dayMap[date.getDay()] ?? null;
}

function isStrengthWorkout(workout) {
  return (workout?.exercises ?? []).some(
    (exercise) => exercise.trackingType !== "completion",
  );
}

function getStrengthWorkoutTarget(schedule) {
  return Object.values(schedule).filter((workoutKey) =>
    isStrengthWorkout(workoutProgram[workoutKey]),
  ).length;
}

function getCompletedStrengthWorkoutDatesThisWeek(
  sessions,
  schedule,
) {
  const weekStart = getWeekStart();

  if (!weekStart) {
    return new Set();
  }

  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(weekStart.getDate() + 7);

  return new Set(sessions.filter((session) => {
    const date = new Date(session.date);
    const day = getWeekdayKeyFromDate(session.date);
    const scheduledWorkout =
      workoutProgram[schedule[day]] ?? null;

    return (
      !Number.isNaN(date.getTime()) &&
      date >= weekStart &&
      date < nextWeekStart &&
      scheduledWorkout &&
      isStrengthWorkout(scheduledWorkout)
    );
  }).map((session) => getDateKey(session.date)));
}

function getNutritionTotals(entries) {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + Number(entry.calories || 0),
      protein: totals.protein + Number(entry.protein || 0),
      carbs: totals.carbs + Number(entry.carbs || 0),
      fat: totals.fat + Number(entry.fat || 0),
      fiber: totals.fiber + Number(entry.fiber || 0),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
  );
}

const dashboardNutritionMetrics = [
  {
    key: "protein",
    label: "Protein",
    unit: "g",
    Icon: Dumbbell,
    color: "#8ea7ff",
  },
  {
    key: "carbs",
    label: "Carbs",
    unit: "g",
    Icon: Pizza,
    color: "#f5c95b",
  },
  {
    key: "fat",
    label: "Fats",
    unit: "g",
    Icon: Nut,
    color: "#ef6f61",
  },
  {
    key: "fiber",
    label: "Fiber",
    unit: "g",
    Icon: Leaf,
    color: "#4fd3a6",
  },
];

const macroCaloriesPerUnit = {
  protein: 4,
  carbs: 4,
  fat: 9,
  fiber: 2,
};

function formatNutritionAmount(value, unit = "") {
  const number = Number(value || 0);

  if (number % 1 === 0) {
    return `${number}${unit}`;
  }

  return `${number.toFixed(1)}${unit}`;
}

function getNutritionProgress(current, target) {
  const targetNumber = Number(target || 0);

  if (targetNumber <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((Number(current || 0) / targetNumber) * 100),
  );
}

function getMacroCalorieSegments(totals) {
  return dashboardNutritionMetrics
    .map(({ key, color }) => ({
      key,
      color,
      calories:
        Number(totals[key] || 0) *
        (macroCaloriesPerUnit[key] ?? 0),
    }))
    .filter(({ calories }) => calories > 0);
}

function DashboardCalorieRing({ current, target, segments }) {
  const targetNumber = Number(target || 0);
  const currentNumber = Number(current || 0);
  const remaining = Math.max(0, targetNumber - currentNumber);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="dashboard-nutrition-ring">
      <svg viewBox="0 0 112 112" aria-hidden="true">
        <circle
          className="dashboard-nutrition-ring__track"
          cx="56"
          cy="56"
          r={radius}
        />
        {targetNumber > 0 &&
          segments.map((segment) => {
            const available = Math.max(
              0,
              targetNumber - offset,
            );
            const calories = Math.min(
              segment.calories,
              available,
            );
            const length =
              (calories / targetNumber) * circumference;
            const dashOffset =
              (-offset / targetNumber) * circumference;

            offset += calories;

            if (length <= 0) {
              return null;
            }

            return (
              <circle
                className="dashboard-nutrition-ring__segment"
                cx="56"
                cy="56"
                key={segment.key}
                r={radius}
                stroke={segment.color}
                strokeDasharray={`${length} ${
                  circumference - length
                }`}
                strokeDashoffset={dashOffset}
              />
            );
          })}
      </svg>

      <div>
        <strong>{Math.round(remaining)}</strong>
        <span>cal left</span>
      </div>
    </div>
  );
}

function DashboardMacroBar({ metric, totals, targets }) {
  const { key, label, unit, Icon, color } = metric;
  const current = totals[key];
  const target = targets[key];
  const progress = getNutritionProgress(current, target);

  return (
    <div className="dashboard-nutrition-macro">
      <div>
        <span style={{ "--metric-color": color }}>
          <Icon size={13} />
        </span>
        <small>{label}</small>
      </div>
      <strong>
        {formatNutritionAmount(current, unit)}
        <span> / {formatNutritionAmount(target, unit)}</span>
      </strong>
      <div className="dashboard-nutrition-macro__track">
        <span
          style={{
            width: `${progress}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [currentWeight, setCurrentWeight] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [isEditingWeight, setIsEditingWeight] =
    useState(false);
  const [isWeightLoading, setIsWeightLoading] =
    useState(false);
  const [isWeightSaving, setIsWeightSaving] =
    useState(false);
  const [weightError, setWeightError] = useState("");
  const [profileDisplayName, setProfileDisplayName] =
    useState("");
  const [workoutSchedule, setWorkoutSchedule] = useState(
    defaultWorkoutSchedule,
  );
  const [isTodayWorkoutFinished, setIsTodayWorkoutFinished] =
    useState(false);
  const [completedWorkoutDates, setCompletedWorkoutDates] =
    useState(new Set());
  const [nutritionTotals, setNutritionTotals] = useState({
    calories: 0,
    protein: 0,
  });
  const [nutritionTargets, setNutritionTargets] = useState(
    defaultNutritionTargets,
  );

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const displayName =
    profileDisplayName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "there";

  const greeting = getTimeBasedGreeting();
  const todayKey = getTodayKey();
  const todayWorkoutKey = getTodayWorkoutKey(workoutSchedule);
  const todayWorkout = workoutProgram[todayWorkoutKey];
  const todayWorkoutSetCount = todayWorkout.exercises.reduce(
    (total, exercise) => total + exercise.sets,
    0,
  );
  const completedThisWeek = completedWorkoutDates.size;
  const weeklyWorkoutTarget =
    getStrengthWorkoutTarget(workoutSchedule);
  const remainingWorkoutsThisWeek = Math.max(
    0,
    weeklyWorkoutTarget - completedThisWeek,
  );
  const isRecoveryWorkout =
    todayWorkout.exercises.every(
      (exercise) => exercise.trackingType === "completion",
    );
  const isRestDay = todayWorkoutKey === "rest";

  useEffect(() => {
    let isCurrent = true;

    async function loadProfile() {
      if (!user) {
        setCurrentWeight(null);
        setWeightInput("");
        setProfileDisplayName("");
        setWorkoutSchedule(defaultWorkoutSchedule);
        setIsTodayWorkoutFinished(false);
        setCompletedWorkoutDates(new Set());
        setNutritionTotals({
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
        });
        setNutritionTargets(defaultNutritionTargets);
        return;
      }

      setIsWeightLoading(true);
      setWeightError("");

      try {
        const [profile, todaySessions, weekSessions, nutrition] =
          await Promise.all([
          getCurrentUserProfile(user.id),
          getUserWorkoutHistory({
            userId: user.id,
            workoutDate: todayKey,
            limit: 10,
          }),
          getUserWorkoutHistory({
            userId: user.id,
            limit: 75,
          }),
          getNutritionDay({
            userId: user.id,
            date: todayKey,
          }),
        ]);

        if (!isCurrent) {
          return;
        }

        const nextWeight = profile?.currentWeightLb ?? null;

        setProfileDisplayName(profile?.displayName ?? "");
        const normalizedSchedule = normalizeWorkoutSchedule(
          profile?.workoutSchedule ?? defaultWorkoutSchedule,
        );

        setWorkoutSchedule(normalizedSchedule);
        setIsTodayWorkoutFinished(todaySessions.length > 0);
        setCompletedWorkoutDates(
          getCompletedStrengthWorkoutDatesThisWeek(
            weekSessions,
            normalizedSchedule,
          ),
        );
        setNutritionTotals(
          getNutritionTotals(nutrition.entries),
        );
        setNutritionTargets(nutrition.targets);
        setCurrentWeight(nextWeight);
        setWeightInput(
          nextWeight === null ? "" : String(nextWeight),
        );
      } catch (error) {
        if (isCurrent) {
          setWeightError(error.message);
        }
      } finally {
        if (isCurrent) {
          setIsWeightLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isCurrent = false;
    };
  }, [todayKey, user]);

  async function handleSaveWeight(event) {
    event.preventDefault();

    setIsWeightSaving(true);
    setWeightError("");

    try {
      const nextWeight = await updateCurrentWeight({
        user,
        weight: weightInput,
      });

      setCurrentWeight(nextWeight);
      setWeightInput(
        nextWeight === null ? "" : String(nextWeight),
      );
      setIsEditingWeight(false);
    } catch (error) {
      setWeightError(error.message);
    } finally {
      setIsWeightSaving(false);
    }
  }

  function handleCancelWeightEdit() {
    setWeightInput(
      currentWeight === null ? "" : String(currentWeight),
    );
    setWeightError("");
    setIsEditingWeight(false);
  }

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{today}</p>
          <h1>
            {greeting}, {displayName}.
          </h1>
          <p>Here is what you have planned for today.</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="card card--workout">
          <div className="card__header">
            <div>
              <span className="card__label">
                Current workout for the day
              </span>
              <h2>{todayWorkout.name}</h2>
            </div>

            <div className="card__icon">
              {isTodayWorkoutFinished ? (
                <CheckCircle2 size={22} />
              ) : (
                <Dumbbell size={22} />
              )}
            </div>
          </div>

          <div className="workout-summary">
            <div>
              <span>
                {isRecoveryWorkout ? "Plan items" : "Exercises"}
              </span>
              <strong>{todayWorkout.exercises.length}</strong>
            </div>

            <div>
              <span>
                {isRecoveryWorkout ? "Focus" : "Estimated time"}
              </span>
              <strong>
                {isRecoveryWorkout
                  ? isRestDay
                    ? "Rest"
                    : "Walk"
                  : `${todayWorkout.estimatedMinutes} min`}
              </strong>
            </div>

            <div>
              <span>
                {isRecoveryWorkout ? "Type" : "Total sets"}
              </span>
              <strong>
                {isRecoveryWorkout
                  ? todayWorkout.name
                  : todayWorkoutSetCount}
              </strong>
            </div>
          </div>

          <Link
            className={`primary-button ${
              isTodayWorkoutFinished
                ? "primary-button--complete"
                : ""
            }`}
            to="/workout"
          >
            {isTodayWorkoutFinished
              ? "View finished workout"
              : isRecoveryWorkout
                ? "Open plan"
                : "Start workout"}
            <ArrowRight size={18} />
          </Link>
        </article>

        <article className="card stat-card">
          <div className="stat-card__icon">
            <Scale size={20} />
          </div>

          <span>Current weight</span>

          {!isEditingWeight ? (
            <>
              <strong>
                {isWeightLoading ? (
                  <LoaderCircle
                    className="spin"
                    size={24}
                  />
                ) : currentWeight === null ? (
                  "Not set"
                ) : (
                  `${currentWeight.toFixed(1)} lb`
                )}
              </strong>

              <button
                type="button"
                className="stat-card__edit"
                disabled={!user || isWeightLoading}
                onClick={() => setIsEditingWeight(true)}
              >
                <Pencil size={15} />
                {currentWeight === null ? "Add weight" : "Edit"}
              </button>

              <small>
                {user
                  ? "Update your latest measurement"
                  : "Sign in to save your weight"}
              </small>
            </>
          ) : (
            <form
              className="stat-card__weight-form"
              onSubmit={handleSaveWeight}
            >
              <label>
                <span className="sr-only">
                  Current weight in pounds
                </span>
                <input
                  type="number"
                  min="40"
                  max="900"
                  step="0.1"
                  inputMode="decimal"
                  value={weightInput}
                  placeholder="159.0"
                  onChange={(event) =>
                    setWeightInput(event.target.value)
                  }
                />
              </label>

              <div className="stat-card__weight-actions">
                <button
                  type="submit"
                  disabled={isWeightSaving}
                  aria-label="Save current weight"
                >
                  {isWeightSaving ? (
                    <LoaderCircle
                      className="spin"
                      size={16}
                    />
                  ) : (
                    <Save size={16} />
                  )}
                </button>

                <button
                  type="button"
                  disabled={isWeightSaving}
                  aria-label="Cancel weight edit"
                  onClick={handleCancelWeightEdit}
                >
                  <X size={16} />
                </button>
              </div>
            </form>
          )}

          {weightError && (
            <small className="stat-card__error">
              {weightError}
            </small>
          )}
        </article>

        <article className="card dashboard-nutrition-card">
          <div className="card__header">
            <div>
              <span className="card__label">
                Today’s nutrition
              </span>
              <h2>Daily intake</h2>
            </div>

            <div className="card__icon">
              <Salad size={20} />
            </div>
          </div>

          <div className="dashboard-nutrition-summary">
            <DashboardCalorieRing
              current={nutritionTotals.calories}
              target={nutritionTargets.calories}
              segments={getMacroCalorieSegments(
                nutritionTotals,
              )}
            />

            <div className="dashboard-nutrition-macros">
              {dashboardNutritionMetrics.map((metric) => (
                <DashboardMacroBar
                  key={metric.key}
                  metric={metric}
                  totals={nutritionTotals}
                  targets={nutritionTargets}
                />
              ))}
            </div>
          </div>

          <Link className="text-link" to="/nutrition">
            Log food
            <ArrowRight size={16} />
          </Link>
        </article>

        <article className="card stat-card">
          <div className="stat-card__icon">
            <CalendarDays size={20} />
          </div>

          <span>This week</span>
          <strong>
            {completedThisWeek} of {weeklyWorkoutTarget}
          </strong>
          <small>
            {remainingWorkoutsThisWeek === 0
              ? "Weekly target reached"
              : `${remainingWorkoutsThisWeek} session${
                  remainingWorkoutsThisWeek === 1 ? "" : "s"
                } remaining`}
          </small>
        </article>

      </section>
    </div>
  );
}

export default Dashboard;
