import {
  Droplets,
  Dumbbell,
  Flame,
  Leaf,
  LogIn,
  Nut,
  Pizza,
  Plus,
  Save,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import { useAuth } from "../context/useAuth";
import {
  addNutritionEntry,
  defaultNutritionTargets,
  deleteNutritionEntry,
  emptyNutritionEntry,
  getNutritionDay,
  getTodayKey,
  saveNutritionTargets,
} from "../services/nutrition";

const nutritionMetrics = [
  {
    key: "calories",
    label: "Calories",
    unit: "cal",
    Icon: Flame,
  },
  {
    key: "protein",
    label: "Protein",
    unit: "g",
    Icon: Dumbbell,
  },
  {
    key: "carbs",
    label: "Carbs",
    unit: "g",
    Icon: Pizza,
  },
  {
    key: "fat",
    label: "Fats",
    unit: "g",
    Icon: Nut,
  },
  {
    key: "fiber",
    label: "Fiber",
    unit: "g",
    Icon: Leaf,
  },
  {
    key: "water",
    label: "Hydration",
    unit: "oz",
    Icon: Droplets,
  },
];

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatAmount(value, unit) {
  const number = toNumber(value);

  if (number % 1 === 0) {
    return `${number}${unit === "cal" ? "" : unit}`;
  }

  return `${number.toFixed(1)}${unit === "cal" ? "" : unit}`;
}

function getProgress(current, target) {
  const targetNumber = toNumber(target);

  if (targetNumber <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((toNumber(current) / targetNumber) * 100),
  );
}

function getTotals(entries) {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + toNumber(entry.calories),
      protein: totals.protein + toNumber(entry.protein),
      carbs: totals.carbs + toNumber(entry.carbs),
      fat: totals.fat + toNumber(entry.fat),
      fiber: totals.fiber + toNumber(entry.fiber),
      water: totals.water + toNumber(entry.water),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      water: 0,
    },
  );
}

function Nutrition() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const [date] = useState(getTodayKey);
  const [targets, setTargets] = useState(
    defaultNutritionTargets,
  );
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState(
    emptyNutritionEntry,
  );
  const [isNutritionLoading, setIsNutritionLoading] =
    useState(false);
  const [isSavingTargets, setIsSavingTargets] =
    useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const totals = useMemo(() => getTotals(entries), [entries]);

  useEffect(() => {
    let isCurrent = true;

    async function loadNutrition() {
      if (!user) {
        setTargets(defaultNutritionTargets);
        setEntries([]);
        setNewEntry(emptyNutritionEntry);
        return;
      }

      setIsNutritionLoading(true);
      setErrorMessage("");

      try {
        const nutrition = await getNutritionDay({
          userId: user.id,
          date,
        });

        if (!isCurrent) {
          return;
        }

        setTargets(nutrition.targets);
        setEntries(nutrition.entries);
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(error.message);
        }
      } finally {
        if (isCurrent) {
          setIsNutritionLoading(false);
        }
      }
    }

    loadNutrition();

    return () => {
      isCurrent = false;
    };
  }, [date, user]);

  async function handleSignIn() {
    try {
      setErrorMessage("");
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleSaveTargets() {
    setIsSavingTargets(true);
    setNotice("");
    setErrorMessage("");

    try {
      const savedTargets = await saveNutritionTargets({
        userId: user?.id,
        targets,
      });

      setTargets(savedTargets);
      setNotice("Daily targets saved.");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSavingTargets(false);
    }
  }

  async function handleAddEntry(event) {
    event.preventDefault();

    setIsAddingEntry(true);
    setNotice("");
    setErrorMessage("");

    try {
      const savedEntry = await addNutritionEntry({
        userId: user?.id,
        date,
        entry: newEntry,
      });

      setEntries((current) => [...current, savedEntry]);
      setNewEntry(emptyNutritionEntry);
      setNotice("Food added.");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsAddingEntry(false);
    }
  }

  async function handleDeleteEntry(entryId) {
    setDeletingEntryId(entryId);
    setNotice("");
    setErrorMessage("");

    try {
      await deleteNutritionEntry({
        userId: user?.id,
        entryId,
      });

      setEntries((current) =>
        current.filter((entry) => entry.id !== entryId),
      );
      setNotice("Food removed.");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setDeletingEntryId("");
    }
  }

  function updateTarget(key, value) {
    setTargets((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateNewEntry(key, value) {
    setNewEntry((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="page nutrition-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Daily targets</p>
          <h1>Nutrition</h1>
          <p>Monitor calories, protein, fiber, and hydration.</p>
        </div>
      </section>

      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}

      {notice && (
        <div className="nutrition-page__notice">{notice}</div>
      )}

      {!isLoading && !user ? (
        <section className="auth-required-card">
          <div>
            <User size={22} />
          </div>

          <div>
            <strong>Sign in to track nutrition</strong>
            <p>
              Your targets and daily food entries are saved
              to your account.
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
      ) : (
        <>
          <section className="nutrition-page__summary">
            {nutritionMetrics.map(({ key, label, unit, Icon }) => {
              const current = totals[key];
              const target = targets[key];
              const progress = getProgress(current, target);
              const remaining = Math.max(
                0,
                toNumber(target) - toNumber(current),
              );

              return (
                <Card
                  className="nutrition-metric"
                  key={key}
                  padding="medium"
                >
                  <div className="nutrition-metric__header">
                    <span>
                      <Icon size={18} />
                    </span>

                    <small>{label}</small>
                  </div>

                  <strong>
                    {formatAmount(current, unit)}
                    <span>
                      {" "}
                      / {formatAmount(target, unit)}
                      {unit === "cal" ? " cal" : ""}
                    </span>
                  </strong>

                  <div className="nutrition-metric__track">
                    <span style={{ width: `${progress}%` }} />
                  </div>

                  <p>
                    {remaining > 0
                      ? `${formatAmount(remaining, unit)} ${
                          unit === "cal" ? "cal " : ""
                        }left`
                      : "Target reached"}
                  </p>

                  <label className="nutrition-metric__target">
                    <span>Target</span>
                    <input
                      type="number"
                      min="0"
                      step={unit === "cal" ? "1" : "0.1"}
                      value={targets[key]}
                      disabled={isNutritionLoading}
                      onChange={(event) =>
                        updateTarget(key, event.target.value)
                      }
                    />
                  </label>
                </Card>
              );
            })}
          </section>

          <div className="nutrition-page__target-actions">
            <Button
              variant="secondary"
              loading={isSavingTargets}
              disabled={isNutritionLoading}
              onClick={handleSaveTargets}
            >
              <Save size={17} />
              Save targets
            </Button>
          </div>

          <Card className="nutrition-page__card">
            <div className="nutrition-page__card-heading">
              <h2>Today’s food</h2>
              <p>
                Add each food or drink once, and FitCircle
                totals the day.
              </p>
            </div>

            <form
              className="nutrition-entry-form"
              onSubmit={handleAddEntry}
            >
              <Input
                label="Food"
                value={newEntry.name}
                maxLength={120}
                disabled={isNutritionLoading}
                placeholder="Protein shake"
                onChange={(event) =>
                  updateNewEntry("name", event.target.value)
                }
              />

              {nutritionMetrics.map(({ key, label, unit }) => (
                <Input
                  key={key}
                  label={unit === "cal" ? label : `${label} (${unit})`}
                  type="number"
                  min="0"
                  step={unit === "cal" ? "1" : "0.1"}
                  value={newEntry[key]}
                  disabled={isNutritionLoading}
                  onChange={(event) =>
                    updateNewEntry(key, event.target.value)
                  }
                />
              ))}

              <Button
                type="submit"
                loading={isAddingEntry}
                disabled={isNutritionLoading}
              >
                <Plus size={17} />
                Add food
              </Button>
            </form>

            {entries.length === 0 ? (
              <div className="nutrition-entry-empty">
                <strong>No food added yet</strong>
                <p>
                  Add your first item and the totals above
                  will update.
                </p>
              </div>
            ) : (
              <div className="nutrition-entry-list">
                <div className="nutrition-entry-list__header">
                  <span>Food</span>
                  <span>Cal</span>
                  <span>Protein</span>
                  <span>Carbs</span>
                  <span>Fats</span>
                  <span>Fiber</span>
                  <span>Water</span>
                  <span />
                </div>

                {entries.map((entry) => (
                  <div
                    className="nutrition-entry-row"
                    key={entry.id}
                  >
                    <strong>{entry.name}</strong>
                    <span>
                      {formatAmount(entry.calories, "cal")}
                    </span>
                    <span>{formatAmount(entry.protein, "g")}</span>
                    <span>{formatAmount(entry.carbs, "g")}</span>
                    <span>{formatAmount(entry.fat, "g")}</span>
                    <span>{formatAmount(entry.fiber, "g")}</span>
                    <span>{formatAmount(entry.water, "oz")}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${entry.name}`}
                      disabled={deletingEntryId === entry.id}
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default Nutrition;
