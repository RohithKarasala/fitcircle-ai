import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Dumbbell,
  Flame,
  Leaf,
  LogIn,
  Nut,
  Pizza,
  Plus,
  Save,
  Search,
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
import { searchFoodProducts } from "../services/foodSearch";

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

const metricColors = {
  calories: "#c8f550",
  protein: "#8ea7ff",
  carbs: "#f5c95b",
  fat: "#ff9f5a",
  fiber: "#4fd3a6",
  water: "#5bc9f5",
};

const macroCaloriesPerUnit = {
  protein: 4,
  carbs: 4,
  fat: 9,
  fiber: 2,
};

const overviewMetricKeys = ["protein", "carbs", "fat", "fiber"];

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

function getMacroCalorieSegments(totals, metrics) {
  return metrics
    .map(({ key }) => ({
      key,
      color: metricColors[key],
      calories:
        toNumber(totals[key]) *
        (macroCaloriesPerUnit[key] ?? 0),
    }))
    .filter(({ calories }) => calories > 0);
}

function CalorieRing({ current, target, segments = [] }) {
  const targetNumber = toNumber(target);
  const currentNumber = toNumber(current);
  const remaining = Math.max(0, targetNumber - currentNumber);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="nutrition-calorie-ring">
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <circle
          className="nutrition-calorie-ring__track"
          cx="110"
          cy="110"
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
                className="nutrition-calorie-ring__segment"
                cx="110"
                cy="110"
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
        <strong>{formatAmount(remaining, "cal")}</strong>
        <span>cal left</span>
        <small>
          {formatAmount(currentNumber, "cal")} /{" "}
          {formatAmount(targetNumber, "cal")} cal
        </small>
      </div>
    </div>
  );
}

function MacroBar({ metric, current, target }) {
  const { key, label, unit, Icon } = metric;
  const progress = getProgress(current, target);
  const color = metricColors[key];

  return (
    <div className="nutrition-macro-bar">
      <div className="nutrition-macro-bar__header">
        <span style={{ "--metric-color": color }}>
          <Icon size={16} />
        </span>
        <small>{label}</small>
      </div>

      <strong>
        {formatAmount(current, unit)}
        <span>
          {" "}
          / {formatAmount(target, unit)}
        </span>
      </strong>

      <div className="nutrition-macro-bar__track">
        <span
          style={{
            width: `${progress}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function getDateFromKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function shiftDateKey(dateKey, amount) {
  const date = getDateFromKey(dateKey);

  date.setDate(date.getDate() + amount);

  const timezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10);
}

function formatSelectedDate(dateKey) {
  const todayKey = getTodayKey();
  const yesterdayKey = shiftDateKey(todayKey, -1);

  if (dateKey === todayKey) {
    return "Today";
  }

  if (dateKey === yesterdayKey) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(getDateFromKey(dateKey));
}

function Nutrition() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const todayKey = getTodayKey();
  const [date, setDate] = useState(todayKey);
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
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [isFoodSearchLoading, setIsFoodSearchLoading] =
    useState(false);
  const [foodSearchStatus, setFoodSearchStatus] = useState("");
  const [deletingEntryId, setDeletingEntryId] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const totals = useMemo(() => getTotals(entries), [entries]);
  const isTodaySelected = date === todayKey;
  const overviewMetrics = useMemo(
    () =>
      nutritionMetrics.filter(({ key }) =>
        overviewMetricKeys.includes(key),
      ),
    [],
  );
  const calorieSegments = useMemo(
    () => getMacroCalorieSegments(totals, overviewMetrics),
    [overviewMetrics, totals],
  );

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

  useEffect(() => {
    const query = newEntry.name.trim();

    if (query.length < 2) {
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsFoodSearchLoading(true);
      setFoodSearchStatus("");

      try {
        const products = await searchFoodProducts(query, {
          signal: controller.signal,
        });

        setFoodSuggestions(products);
        setFoodSearchStatus(
          products.length === 0
            ? "No matches found. Manual entry is ready."
            : "",
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setFoodSuggestions([]);
          setFoodSearchStatus(
            "Food search is unavailable. Manual entry is ready.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFoodSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [newEntry.name]);

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
    if (key === "name" && !value.trim()) {
      setFoodSuggestions([]);
      setFoodSearchStatus("");
      setIsFoodSearchLoading(false);
      setNewEntry(emptyNutritionEntry);
      return;
    }

    if (key === "name" && value.trim().length < 2) {
      setFoodSuggestions([]);
      setFoodSearchStatus("");
      setIsFoodSearchLoading(false);
    }

    setNewEntry((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyFoodSuggestion(product) {
    setNewEntry((current) => ({
      ...current,
      name: product.name,
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat,
      fiber: product.fiber,
      water: current.water,
    }));
    setFoodSuggestions([]);
    setFoodSearchStatus("Autofilled per 100g. Adjust if needed.");
  }

  function updateDate(nextDate) {
    if (!nextDate || nextDate > todayKey) {
      return;
    }

    setNotice("");
    setDate(nextDate);
    setNewEntry(emptyNutritionEntry);
  }

  return (
    <div className="page nutrition-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Daily targets</p>
          <h1>Nutrition</h1>
          <p>Monitor calories, protein, fiber, and hydration.</p>
        </div>

        <div className="nutrition-date-control">
          <div>
            <CalendarDays size={18} />
            <span>{formatSelectedDate(date)}</span>
          </div>

          <div>
            <button
              type="button"
              aria-label="View previous day"
              onClick={() => updateDate(shiftDateKey(date, -1))}
            >
              <ChevronLeft size={18} />
            </button>

            <input
              type="date"
              max={todayKey}
              value={date}
              onChange={(event) =>
                updateDate(event.target.value)
              }
            />

            <button
              type="button"
              aria-label="View next day"
              disabled={isTodaySelected}
              onClick={() => updateDate(shiftDateKey(date, 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
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
          <Card className="nutrition-overview-card">
            <div className="nutrition-overview-card__main">
              <CalorieRing
                current={totals.calories}
                segments={calorieSegments}
                target={targets.calories}
              />

              <div className="nutrition-macro-grid">
                {overviewMetrics.map((metric) => (
                  <MacroBar
                    key={metric.key}
                    metric={metric}
                    current={totals[metric.key]}
                    target={targets[metric.key]}
                  />
                ))}
              </div>
            </div>
          </Card>

          <Card className="nutrition-target-card">
            <div className="nutrition-target-card__heading">
              <div>
                <h2>Daily targets</h2>
                <p>Adjust goals without leaving the page.</p>
              </div>

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

            <div className="nutrition-target-grid">
              {nutritionMetrics.map(({ key, label, unit }) => (
                <label
                  className="nutrition-target-input"
                  key={key}
                >
                  <span>{label}</span>
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
              ))}
            </div>
          </Card>

          <Card className="nutrition-page__card">
            <div className="nutrition-page__card-heading">
              <h2>Today’s food</h2>
              <p>
                Add each food or drink once, and FitCircle
                totals {formatSelectedDate(date).toLowerCase()}.
              </p>
            </div>

            <form
              className="nutrition-entry-form"
              onSubmit={handleAddEntry}
            >
              <div className="nutrition-food-search">
                <Input
                  label="Food"
                  value={newEntry.name}
                  maxLength={120}
                  disabled={isNutritionLoading}
                  placeholder="Search food or type manually"
                  autoComplete="off"
                  onChange={(event) =>
                    updateNewEntry("name", event.target.value)
                  }
                />

                <div className="nutrition-food-search__meta">
                  <Search size={14} />
                  <span>
                    {isFoodSearchLoading
                      ? "Searching food databases..."
                      : foodSearchStatus ||
                        "Search can autofill per 100g from food databases."}
                  </span>
                </div>

                {foodSuggestions.length > 0 && (
                  <div className="nutrition-food-suggestions">
                    {foodSuggestions.map((product) => (
                      <button
                        type="button"
                        key={`${product.source}-${product.id}`}
                        onClick={() => applyFoodSuggestion(product)}
                      >
                        <span>
                          <strong>{product.name}</strong>
                          {(product.brand ||
                            product.servingSize) && (
                            <small>
                              {[
                                product.brand,
                                product.servingSize,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </small>
                          )}
                          <small className="nutrition-food-suggestions__source">
                            {product.source}
                          </small>
                        </span>

                        <small>
                          {product.calories || "—"} cal ·{" "}
                          {product.protein || "—"}g protein
                        </small>
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
