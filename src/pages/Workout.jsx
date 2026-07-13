import { Check, RotateCcw, Save } from "lucide-react";
import { useMemo, useState } from "react";
import ExerciseCard from "../components/workout/ExerciseCard";
import {
  getTodayWorkoutKey,
  workoutDays,
  workoutProgram,
} from "../data/workoutProgram";

const STORAGE_KEY = "fitcircle-workout-history";

function createExerciseSets(exercise) {
  return Array.from({ length: exercise.sets }, (_, index) => ({
    id: crypto.randomUUID(),
    setNumber: index + 1,
    weight: "",
    reps: "",
    rir: "",
  }));
}

function createWorkoutState(workout) {
  return Object.fromEntries(
    workout.exercises.map((exercise) => [
      exercise.id,
      createExerciseSets(exercise),
    ]),
  );
}

function getStoredHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function hasLoggedSets(entry) {
  return entry.exercises.some((exercise) =>
    exercise.sets.some(
      (set) => set.weight !== "" || set.reps !== "",
    ),
  );
}

function Workout() {
  const initialDay = getTodayWorkoutKey();

  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [workoutSets, setWorkoutSets] = useState(() =>
    createWorkoutState(workoutProgram[initialDay]),
  );
  const [history, setHistory] = useState(getStoredHistory);
  const [saveMessage, setSaveMessage] = useState("");

  const workout = workoutProgram[selectedDay];

  const previousWorkouts = useMemo(
    () =>
      history.filter(
        (entry) =>
          entry.day === selectedDay && hasLoggedSets(entry),
      ),
    [history, selectedDay],
  );

  const previousWorkout = previousWorkouts[0];

  const completedSets = Object.values(workoutSets)
    .flat()
    .filter((set) => set.weight !== "" && set.reps !== "").length;

  const totalSets = Object.values(workoutSets).flat().length;

  const changeWorkoutDay = (day) => {
    const nextWorkout = workoutProgram[day];

    setSelectedDay(day);
    setWorkoutSets(createWorkoutState(nextWorkout));
    setSaveMessage("");
  };

  const updateExerciseSets = (exerciseId, sets) => {
    setWorkoutSets((current) => ({
      ...current,
      [exerciseId]: sets,
    }));
  };

  const resetWorkout = () => {
    const confirmed = window.confirm(
      "Clear all entries from this workout?",
    );

    if (!confirmed) {
      return;
    }

    setWorkoutSets(createWorkoutState(workout));
    setSaveMessage("");
  };

  const saveWorkout = () => {
    const exercises = workout.exercises.map((exercise) => ({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: workoutSets[exercise.id],
    }));

    const workoutEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      day: selectedDay,
      workoutName: workout.name,
      exercises,
    };

    const updatedHistory = [workoutEntry, ...history];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedHistory),
    );

    setHistory(updatedHistory);
    setSaveMessage("Workout saved on this device.");
  };

  return (
    <div className="page workout-page">
      <section className="page-heading workout-page__heading">
        <div>
          <p className="eyebrow">Training</p>
          <h1>{workout.name}</h1>
          <p>
            {workout.focus} · Approximately{" "}
            {workout.estimatedMinutes} minutes
          </p>
        </div>

        <div className="workout-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={resetWorkout}
          >
            <RotateCcw size={17} />
            Reset
          </button>

          <button
            type="button"
            className="primary-action-button"
            onClick={saveWorkout}
          >
            <Save size={17} />
            Save workout
          </button>
        </div>
      </section>

      <section
        className="day-selector"
        aria-label="Select workout day"
      >
        {workoutDays.map((day) => (
          <button
            type="button"
            key={day}
            className={`day-selector__button ${
              selectedDay === day
                ? "day-selector__button--active"
                : ""
            }`}
            onClick={() => changeWorkoutDay(day)}
          >
            <span>{workoutProgram[day].label.slice(0, 3)}</span>
            <small>{workoutProgram[day].name}</small>
          </button>
        ))}
      </section>

      <section className="workout-progress-card">
        <div>
          <span>Workout progress</span>
          <strong>
            {completedSets} of {totalSets} sets logged
          </strong>
        </div>

        <div className="workout-progress-bar">
          <span
            style={{
              width: `${
                totalSets
                  ? (completedSets / totalSets) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </section>

      {saveMessage && (
        <div className="success-message">
          <Check size={18} />
          {saveMessage}
        </div>
      )}

      <section className="exercise-list">
        {workout.exercises.map((exercise) => {
          const previousExercise =
            previousWorkout?.exercises.find(
              (item) => item.exerciseId === exercise.id,
            );

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              sets={workoutSets[exercise.id]}
              previousSets={previousExercise?.sets ?? []}
              onSetsChange={(sets) =>
                updateExerciseSets(exercise.id, sets)
              }
            />
          );
        })}
      </section>

      {previousWorkouts.length > 0 && (
        <section className="workout-history">
          <div className="workout-history__heading">
            <p className="eyebrow">History</p>
            <h2>Recent {workout.name} sessions</h2>
          </div>

          <div className="workout-history__list">
            {previousWorkouts.slice(0, 5).map((session) => (
              <article
                className="workout-history__card"
                key={session.id}
              >
                <div className="workout-history__date">
                  <strong>
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(session.date))}
                  </strong>

                  <span>
                    {new Intl.DateTimeFormat("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(session.date))}
                  </span>
                </div>

                <div className="workout-history__exercises">
                  {session.exercises.map((exercise) => {
                    const loggedSets = exercise.sets.filter(
                      (set) =>
                        set.weight !== "" || set.reps !== "",
                    );

                    if (loggedSets.length === 0) {
                      return null;
                    }

                    return (
                      <div key={exercise.exerciseId}>
                        <strong>
                          {exercise.exerciseName}
                        </strong>

                        <span>
                          {loggedSets
                            .map(
                              (set) =>
                                `${set.weight || "—"} lb × ${
                                  set.reps || "—"
                                }${
                                  set.rir !== ""
                                    ? ` · ${set.rir} RIR`
                                    : ""
                                }`,
                            )
                            .join(" | ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Workout;
