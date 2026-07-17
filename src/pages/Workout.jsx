import {
  Check,
  Cloud,
  LoaderCircle,
  LogIn,
  RotateCcw,
  Save,
  Share2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ExerciseCard from "../components/workout/ExerciseCard";
import { useAuth } from "../context/useAuth";
import {
  getTodayWorkoutKey,
  normalizeWorkoutSchedule,
  workoutDays,
  workoutProgram,
} from "../data/workoutProgram";
import {
  ensureUserProfile,
  getUserWorkoutHistory,
  saveWorkoutSession,
} from "../services/workouts";
import { getCurrentUserProfile } from "../services/profile";
import {
  useGroups,
  useShareWorkout,
} from "../hooks/useGroups";

const DRAFT_STORAGE_KEY = "fitcircle-workout-drafts";

function createExerciseSets(exercise) {
  return Array.from(
    { length: exercise.sets },
    (_, index) => ({
      id: crypto.randomUUID(),
      setNumber: index + 1,
      weight: "",
      reps: "",
      rir: "",
    }),
  );
}

function createWorkoutState(workout) {
  return Object.fromEntries(
    workout.exercises.map((exercise) => [
      exercise.id,
      createExerciseSets(exercise),
    ]),
  );
}

function getDrafts() {
  try {
    return (
      JSON.parse(
        localStorage.getItem(DRAFT_STORAGE_KEY),
      ) ?? {}
    );
  } catch {
    return {};
  }
}

function getDraftForDay(day, workout) {
  const drafts = getDrafts();
  const draft = drafts[day];

  if (!draft?.workoutSets) {
    return createWorkoutState(workout);
  }

  return draft.workoutSets;
}

function saveDraftForDay(day, workoutSets) {
  const drafts = getDrafts();

  drafts[day] = {
    savedAt: new Date().toISOString(),
    workoutSets,
  };

  localStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify(drafts),
  );
}

function clearDraftForDay(day) {
  const drafts = getDrafts();

  delete drafts[day];

  localStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify(drafts),
  );
}

function Workout() {
  const { user, isLoading: isAuthLoading, signInWithGoogle } =
    useAuth();

  const initialDay = getTodayWorkoutKey();

  const [selectedDay, setSelectedDay] =
    useState(initialDay);

  const [workoutSets, setWorkoutSets] = useState(() =>
    getDraftForDay(
      initialDay,
      workoutProgram[initialDay],
    ),
  );

  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sharingSessionId, setSharingSessionId] =
    useState("");
  const [shareGroupIds, setShareGroupIds] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const appliedScheduleUserIdRef = useRef("");

  const workout = workoutProgram[selectedDay];

  const {
    data: groups = [],
    isLoading: isGroupsLoading,
  } = useGroups({
    enabled: Boolean(user),
  });

  const shareWorkoutMutation = useShareWorkout();

  useEffect(() => {
    let isCurrent = true;

    async function loadScheduledDay() {
      if (
        !user ||
        appliedScheduleUserIdRef.current === user.id
      ) {
        return;
      }

      try {
        const profile = await getCurrentUserProfile(user.id);

        if (!isCurrent) {
          return;
        }

        const schedule = normalizeWorkoutSchedule(
          profile?.workoutSchedule,
        );
        const scheduledDay = getTodayWorkoutKey(schedule);

        setSelectedDay(scheduledDay);
        setWorkoutSets(
          getDraftForDay(
            scheduledDay,
            workoutProgram[scheduledDay],
          ),
        );
        appliedScheduleUserIdRef.current = user.id;
      } catch (error) {
        console.error(error);

        if (isCurrent) {
          appliedScheduleUserIdRef.current = user.id;
        }
      }
    }

    loadScheduledDay();

    return () => {
      isCurrent = false;
    };
  }, [user]);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }

    setIsHistoryLoading(true);
    setErrorMessage("");

    try {
      await ensureUserProfile(user);

      const sessions = await getUserWorkoutHistory({
        userId: user.id,
        workoutDay: selectedDay,
        limit: 10,
      });

      setHistory(sessions);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [selectedDay, user]);

  useEffect(() => {
    Promise.resolve().then(loadHistory);
  }, [loadHistory]);

  useEffect(() => {
    saveDraftForDay(selectedDay, workoutSets);
  }, [selectedDay, workoutSets]);

  const previousWorkout = history[0];

  const completedSets = Object.values(workoutSets)
    .flat()
    .filter(
      (set) => set.weight !== "" && set.reps !== "",
    ).length;

  const totalSets =
    Object.values(workoutSets).flat().length;

  const changeWorkoutDay = (day) => {
    const nextWorkout = workoutProgram[day];

    setSelectedDay(day);
    setWorkoutSets(getDraftForDay(day, nextWorkout));
    setStatusMessage("");
    setErrorMessage("");
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

    clearDraftForDay(selectedDay);
    setWorkoutSets(createWorkoutState(workout));
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSignIn = async () => {
    try {
      setErrorMessage("");
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  const handleSaveWorkout = async () => {
    if (!user) {
      setErrorMessage(
        "Sign in with Google before saving your workout.",
      );
      return;
    }

    setIsSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const savedSession = await saveWorkoutSession({
        userId: user.id,
        workoutDay: selectedDay,
        workoutName: workout.name,
        workout,
        workoutSets,
      });

      const autoShareGroups = groups.filter(
        (group) => group.autoShareWorkouts,
      );
      let sharedGroupCount = autoShareGroups.length;
      let failedShareCount = 0;

      if (autoShareGroups.length > 0) {
        const shareResults = await Promise.allSettled(
          autoShareGroups.map((group) =>
            shareWorkoutMutation.mutateAsync({
              workoutSessionId: savedSession.id,
              groupId: group.groupId,
              workoutDate:
                savedSession.workout_date ??
                new Date().toISOString(),
            }),
          ),
        );

        failedShareCount = shareResults.filter(
          (result) => result.status === "rejected",
        ).length;
        sharedGroupCount =
          autoShareGroups.length - failedShareCount;
      }

      clearDraftForDay(selectedDay);
      setWorkoutSets(createWorkoutState(workout));
      setStatusMessage(
        sharedGroupCount > 0
          ? `Workout saved and shared to ${sharedGroupCount} group${
              sharedGroupCount === 1 ? "" : "s"
            }.`
          : "Workout saved securely to Supabase.",
      );

      await loadHistory();

      if (failedShareCount > 0) {
        setErrorMessage(
          "Workout saved, but auto-sharing failed for one or more groups.",
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareWorkout = async (session) => {
    if (!user) {
      setErrorMessage(
        "Sign in with Google before sharing your workout.",
      );
      return;
    }

    const groupId =
      shareGroupIds[session.id] ?? groups[0]?.groupId;

    if (!groupId) {
      setErrorMessage(
        "Create or join a group before sharing workouts.",
      );
      return;
    }

    const group = groups.find(
      (item) => item.groupId === groupId,
    );

    setSharingSessionId(session.id);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await shareWorkoutMutation.mutateAsync({
        workoutSessionId: session.id,
        groupId,
        workoutDate: session.date,
      });

      setStatusMessage(
        `Shared workout to ${group?.name ?? "your group"}.`,
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    } finally {
      setSharingSessionId("");
    }
  };

  const previousWorkouts = useMemo(
    () => history,
    [history],
  );

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
            disabled={isSaving || isAuthLoading}
            onClick={handleSaveWorkout}
          >
            {isSaving ? (
              <LoaderCircle
                className="spin"
                size={17}
              />
            ) : (
              <Save size={17} />
            )}

            {isSaving ? "Saving…" : "Save workout"}
          </button>
        </div>
      </section>

      {!isAuthLoading && !user && (
        <section className="auth-required-card">
          <div>
            <Cloud size={22} />
          </div>

          <div>
            <strong>Sign in to save across devices</strong>
            <p>
              Your current workout remains available as a
              local draft, but completed sessions require an
              account.
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
      )}

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
            <span>
              {workoutProgram[day].label.slice(0, 3)}
            </span>

            <small>
              {workoutProgram[day].name}
            </small>
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

      {statusMessage && (
        <div className="success-message">
          <Check size={18} />
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <section className="exercise-list">
        {workout.exercises.map((exercise) => {
          const previousExercise =
            previousWorkout?.exercises.find(
              (item) =>
                item.exerciseId === exercise.id,
            );

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              sets={
                workoutSets[exercise.id] ??
                createExerciseSets(exercise)
              }
              previousSets={
                previousExercise?.sets ?? []
              }
              onSetsChange={(sets) =>
                updateExerciseSets(
                  exercise.id,
                  sets,
                )
              }
            />
          );
        })}
      </section>

      <section className="workout-history">
        <div className="workout-history__heading">
          <p className="eyebrow">Cloud history</p>
          <h2>Recent {workout.name} sessions</h2>
        </div>

        {isHistoryLoading ? (
          <div className="history-loading">
            <LoaderCircle
              className="spin"
              size={20}
            />
            Loading workout history…
          </div>
        ) : previousWorkouts.length === 0 ? (
          <div className="card empty-state">
            <h3>No saved sessions yet</h3>
            <p>
              Complete and save this workout to create
              your first cloud history entry.
            </p>
          </div>
        ) : (
          <div className="workout-history__list">
            {previousWorkouts
              .slice(0, 5)
              .map((session) => (
                <article
                  className="workout-history__card"
                  key={session.id}
                >
                  <div className="workout-history__date">
                    <strong>
                      {new Intl.DateTimeFormat(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      ).format(
                        new Date(session.date),
                      )}
                    </strong>

                    <span>
                      {new Intl.DateTimeFormat(
                        "en-US",
                        {
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      ).format(
                        new Date(session.date),
                        )}
                    </span>

                    {user && (
                      <div className="workout-history__share">
                        <select
                          aria-label="Choose group to share this workout"
                          value={
                            shareGroupIds[session.id] ??
                            groups[0]?.groupId ??
                            ""
                          }
                          disabled={
                            isGroupsLoading ||
                            sharingSessionId ===
                              session.id ||
                            groups.length === 0
                          }
                          onChange={(event) =>
                            setShareGroupIds(
                              (current) => ({
                                ...current,
                                [session.id]:
                                  event.target.value,
                              }),
                            )
                          }
                        >
                          {groups.length === 0 ? (
                            <option value="">
                              No groups yet
                            </option>
                          ) : (
                            groups.map((group) => (
                              <option
                                key={group.groupId}
                                value={group.groupId}
                              >
                                {group.name}
                              </option>
                            ))
                          )}
                        </select>

                        <button
                          type="button"
                          className="secondary-button"
                          disabled={
                            isGroupsLoading ||
                            sharingSessionId ===
                              session.id ||
                            groups.length === 0
                          }
                          onClick={() =>
                            handleShareWorkout(session)
                          }
                        >
                          {sharingSessionId ===
                          session.id ? (
                            <LoaderCircle
                              className="spin"
                              size={16}
                            />
                          ) : (
                            <Share2 size={16} />
                          )}
                          Share
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="workout-history__exercises">
                    {session.exercises.map(
                      (exercise) => (
                        <div
                          key={exercise.exerciseId}
                        >
                          <strong>
                            {exercise.exerciseName}
                          </strong>

                          <span>
                            {exercise.sets
                              .map(
                                (set) =>
                                  `${
                                    set.weight || "—"
                                  } lb × ${
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
                      ),
                    )}
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Workout;
