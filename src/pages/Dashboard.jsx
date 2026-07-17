import {
  ArrowRight,
  CalendarDays,
  Dumbbell,
  LoaderCircle,
  Pencil,
  Flame,
  Save,
  Scale,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  getCurrentUserProfile,
  updateCurrentWeight,
} from "../services/profile";

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

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "there";

  const firstName = displayName.split(" ")[0];

  useEffect(() => {
    let isCurrent = true;

    async function loadProfile() {
      if (!user) {
        setCurrentWeight(null);
        setWeightInput("");
        return;
      }

      setIsWeightLoading(true);
      setWeightError("");

      try {
        const profile = await getCurrentUserProfile(user.id);

        if (!isCurrent) {
          return;
        }

        const nextWeight = profile?.currentWeightLb ?? null;

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
  }, [user]);

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
          <h1>Good morning, {firstName}.</h1>
          <p>Here is what you have planned for today.</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="card card--workout">
          <div className="card__header">
            <div>
              <span className="card__label">Today’s workout</span>
              <h2>Upper Body Strength</h2>
            </div>

            <div className="card__icon">
              <Dumbbell size={22} />
            </div>
          </div>

          <div className="workout-summary">
            <div>
              <span>Exercises</span>
              <strong>6</strong>
            </div>

            <div>
              <span>Estimated time</span>
              <strong>65 min</strong>
            </div>

            <div>
              <span>Target effort</span>
              <strong>1–2 RIR</strong>
            </div>
          </div>

          <Link className="primary-button" to="/workout">
            Start workout
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

        <article className="card stat-card">
          <div className="stat-card__icon">
            <Flame size={20} />
          </div>

          <span>Workout streak</span>
          <strong>5 days</strong>
          <small>Keep building consistency</small>
        </article>

        <article className="card stat-card">
          <div className="stat-card__icon">
            <CalendarDays size={20} />
          </div>

          <span>This week</span>
          <strong>3 of 5</strong>
          <small>Two sessions remaining</small>
        </article>

        <article className="card card--wide">
          <div className="card__header">
            <div>
              <span className="card__label">AI recommendation</span>
              <h2>Keep today’s working weights steady</h2>
            </div>
          </div>

          <p className="recommendation-copy">
            Complete the prescribed repetitions with controlled technique.
            Increase weight only after reaching the top of the rep range with
            one or two repetitions still in reserve.
          </p>

          <Link className="text-link" to="/coach">
            Open AI Coach
            <ArrowRight size={16} />
          </Link>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
