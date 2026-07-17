import {
  Check,
  Cloud,
  LoaderCircle,
  LogIn,
  RotateCcw,
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
  defaultWorkoutSchedule,
  getWeekdayKey,
  getTodayWorkoutKey,
  normalizeWorkoutSchedule,
  weekDayLabels,
  weekDays,
  workoutProgram,
} from "../data/workoutProgram";
import {
  deleteWorkoutDraft,
  ensureUserProfile,
  getUserWorkoutDrafts,
  getUserWorkoutHistory,
  saveWorkoutSession,
  upsertWorkoutDraft,
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
      exercise.trackingType === "completion"
        ? [
            {
              id: crypto.randomUUID(),
              setNumber: 1,
              weight: "",
              reps: "",
              rir: "",
              completed: false,
            },
          ]
        : createExerciseSets(exercise),
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
  const exerciseIds = workout.exercises.map(
    (exercise) => exercise.id,
  );

  if (!draft?.workoutSets) {
    return createWorkoutState(workout);
  }

  const hasMatchingExercises = exerciseIds.every(
    (exerciseId) => Array.isArray(draft.workoutSets[exerciseId]),
  );

  if (!hasMatchingExercises) {
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

function getWorkoutStateFromDraft(draft, workout) {
  const workoutSets = draft?.workoutPayload?.workoutSets;
  const exerciseIds = workout.exercises.map(
    (exercise) => exercise.id,
  );

  if (!workoutSets) {
    return createWorkoutState(workout);
  }

  const hasMatchingExercises = exerciseIds.every(
    (exerciseId) => Array.isArray(workoutSets[exerciseId]),
  );

  return hasMatchingExercises
    ? workoutSets
    : createWorkoutState(workout);
}

function hasWorkoutEntries(workoutSets) {
  return Object.values(workoutSets)
    .flat()
    .some(
      (set) =>
        set.completed ||
        set.weight !== "" ||
        set.reps !== "" ||
        set.rir !== "",
    );
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

function getFinishedDaysThisWeek(sessions) {
  const weekStart = getWeekStart();

  if (!weekStart) {
    return new Set();
  }

  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(weekStart.getDate() + 7);

  return new Set(
    sessions
      .filter((session) => {
        const date = new Date(session.date);

        return (
          !Number.isNaN(date.getTime()) &&
          date >= weekStart &&
          date < nextWeekStart
        );
      })
      .map((session) => session.day),
  );
}

function getLocalDraftDays(workoutSchedule) {
  return new Set(
    weekDays.filter((day) => {
      const workoutKey =
        workoutSchedule[day] ?? defaultWorkoutSchedule[day];
      const draftSets = getDraftForDay(
        day,
        workoutProgram[workoutKey],
      );

      return hasWorkoutEntries(draftSets);
    }),
  );
}

function Workout() {
  const { user, isLoading: isAuthLoading, signInWithGoogle } =
    useAuth();

  const initialDay = getWeekdayKey();

  const [selectedDay, setSelectedDay] =
    useState(initialDay);
  const [workoutSchedule, setWorkoutSchedule] = useState(
    defaultWorkoutSchedule,
  );
  const initialWorkoutKey =
    workoutSchedule[initialDay] ?? initialDay;

  const [workoutSets, setWorkoutSets] = useState(() =>
    getDraftForDay(
      initialDay,
      workoutProgram[initialWorkoutKey],
    ),
  );

  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [remoteDraftsByDay, setRemoteDraftsByDay] =
    useState({});
  const [hasLoadedRemoteDrafts, setHasLoadedRemoteDrafts] =
    useState(false);
  const [finishedDays, setFinishedDays] = useState(new Set());
  const [draftSaveStatus, setDraftSaveStatus] =
    useState("idle");
  const [sharingSessionId, setSharingSessionId] =
    useState("");
  const [shareGroupIds, setShareGroupIds] = useState({});
  const [trackRir, setTrackRir] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const appliedScheduleUserIdRef = useRef("");

  const selectedWorkoutKey =
    workoutSchedule[selectedDay] ??
    defaultWorkoutSchedule[selectedDay];
  const workout = workoutProgram[selectedWorkoutKey];
  const isCompletionWorkout = workout.exercises.every(
    (exercise) => exercise.trackingType === "completion",
  );
  const localDraftDays = useMemo(
    () => getLocalDraftDays(workoutSchedule),
    [workoutSchedule],
  );
  const selectedDayHasEntries =
    hasWorkoutEntries(workoutSets);

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
      if (!user) {
        setTrackRir(false);
        setWorkoutSchedule(defaultWorkoutSchedule);
        return;
      }

      if (appliedScheduleUserIdRef.current === user.id) {
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
        const today = getWeekdayKey();
        const scheduledWorkoutKey = getTodayWorkoutKey(
          schedule,
        );

        setTrackRir(Boolean(profile?.trackRir));
        setWorkoutSchedule(schedule);
        setSelectedDay(today);
        setWorkoutSets(
          getDraftForDay(
            today,
            workoutProgram[scheduledWorkoutKey],
          ),
        );
        appliedScheduleUserIdRef.current = user.id;
      } catch (error) {
        console.error(error);

        if (isCurrent) {
          setTrackRir(false);
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

  const loadWorkoutStatus = useCallback(async () => {
    if (!user) {
      setRemoteDraftsByDay({});
      setFinishedDays(new Set());
      setHasLoadedRemoteDrafts(false);
      return;
    }

    try {
      const [drafts, sessions] = await Promise.all([
        getUserWorkoutDrafts({ userId: user.id }),
        getUserWorkoutHistory({
          userId: user.id,
          limit: 75,
        }),
      ]);

      const draftMap = Object.fromEntries(
        drafts.map((draft) => [draft.workoutDay, draft]),
      );

      setRemoteDraftsByDay(draftMap);
      setFinishedDays(getFinishedDaysThisWeek(sessions));
      setHasLoadedRemoteDrafts(true);

      const selectedDraft = draftMap[selectedDay];

      if (selectedDraft) {
        const selectedDraftWorkoutKey =
          workoutSchedule[selectedDay] ??
          defaultWorkoutSchedule[selectedDay];

        setWorkoutSets((current) => {
          const draftWorkoutSets = getWorkoutStateFromDraft(
            selectedDraft,
            workoutProgram[selectedDraftWorkoutKey],
          );

          return JSON.stringify(current) ===
            JSON.stringify(draftWorkoutSets)
            ? current
            : draftWorkoutSets;
        });
      }
    } catch (error) {
      console.error(error);
      setHasLoadedRemoteDrafts(true);
      setErrorMessage(error.message);
    }
  }, [selectedDay, user, workoutSchedule]);

  useEffect(() => {
    Promise.resolve().then(loadWorkoutStatus);
  }, [loadWorkoutStatus]);

  useEffect(() => {
    saveDraftForDay(selectedDay, workoutSets);
  }, [selectedDay, workoutSets]);

  useEffect(() => {
    if (!user || !hasLoadedRemoteDrafts) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setDraftSaveStatus("saving");

        if (!selectedDayHasEntries) {
          await deleteWorkoutDraft({
            userId: user.id,
            workoutDay: selectedDay,
          });

          setRemoteDraftsByDay((current) => {
            const nextDrafts = { ...current };
            delete nextDrafts[selectedDay];
            return nextDrafts;
          });
          setDraftSaveStatus("idle");
          return;
        }

        const savedDraft = await upsertWorkoutDraft({
          userId: user.id,
          workoutDay: selectedDay,
          workoutName: workout.name,
          workoutKey: selectedWorkoutKey,
          workoutSets,
        });

        setRemoteDraftsByDay((current) => ({
          ...current,
          [selectedDay]: savedDraft,
        }));
        setDraftSaveStatus("saved");
      } catch (error) {
        console.error(error);
        setDraftSaveStatus("error");
      }
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [
    hasLoadedRemoteDrafts,
    selectedDay,
    selectedDayHasEntries,
    selectedWorkoutKey,
    user,
    workout.name,
    workoutSets,
  ]);

  const previousWorkout = history[0];

  const completedSets = Object.values(workoutSets)
    .flat()
    .filter(
      (set) =>
        set.completed ||
        (set.weight !== "" && set.reps !== ""),
    ).length;

  const totalSets =
    Object.values(workoutSets).flat().length;

  const changeWorkoutDay = (day) => {
    const nextWorkoutKey =
      workoutSchedule[day] ?? defaultWorkoutSchedule[day];
    const nextWorkout = workoutProgram[nextWorkoutKey];
    const remoteDraft = remoteDraftsByDay[day];

    setSelectedDay(day);
    setWorkoutSets(
      remoteDraft
        ? getWorkoutStateFromDraft(remoteDraft, nextWorkout)
        : getDraftForDay(day, nextWorkout),
    );
    setStatusMessage("");
    setErrorMessage("");
  };

  const updateExerciseSets = (exerciseId, sets) => {
    setWorkoutSets((current) => ({
      ...current,
      [exerciseId]: sets,
    }));
  };

  const toggleCompletionExercise = (exerciseId) => {
    setWorkoutSets((current) => {
      const currentSet = current[exerciseId]?.[0];
      const nextCompleted = !currentSet?.completed;

      return {
        ...current,
        [exerciseId]: [
          {
            id: currentSet?.id ?? crypto.randomUUID(),
            setNumber: 1,
            weight: "",
            reps: nextCompleted ? "1" : "",
            rir: "",
            completed: nextCompleted,
          },
        ],
      };
    });
  };

  const resetWorkout = async () => {
    const confirmed = window.confirm(
      "Clear all entries from this workout?",
    );

    if (!confirmed) {
      return;
    }

    clearDraftForDay(selectedDay);
    setWorkoutSets(createWorkoutState(workout));
    setRemoteDraftsByDay((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[selectedDay];
      return nextDrafts;
    });
    setStatusMessage("");
    setErrorMessage("");
    setDraftSaveStatus("idle");

    if (user) {
      try {
        await deleteWorkoutDraft({
          userId: user.id,
          workoutDay: selectedDay,
        });
      } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
      }
    }
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

  const handleFinishWorkout = async () => {
    if (!user) {
      setErrorMessage(
        "Sign in with Google before finishing your workout.",
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
      await deleteWorkoutDraft({
        userId: user.id,
        workoutDay: selectedDay,
      });
      setRemoteDraftsByDay((current) => {
        const nextDrafts = { ...current };
        delete nextDrafts[selectedDay];
        return nextDrafts;
      });
      setFinishedDays((current) => {
        const nextDays = new Set(current);
        nextDays.add(selectedDay);
        return nextDays;
      });
      setWorkoutSets(createWorkoutState(workout));
      setStatusMessage(
        sharedGroupCount > 0
          ? `Workout finished and shared to ${sharedGroupCount} group${
              sharedGroupCount === 1 ? "" : "s"
            }.`
          : "Workout finished securely to Supabase.",
      );
      setDraftSaveStatus("idle");

      await loadHistory();
      await loadWorkoutStatus();

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
  const getDayState = (day) => {
    if (finishedDays.has(day)) {
      return "finished";
    }

    if (
      (day === selectedDay && selectedDayHasEntries) ||
      remoteDraftsByDay[day] ||
      localDraftDays.has(day)
    ) {
      return "draft";
    }

    return "idle";
  };

  const draftStatusText = {
    idle: selectedDayHasEntries
      ? "Draft saved locally"
      : "Not started",
    saving: "Saving draft...",
    saved: "Draft saved",
    error: "Draft save failed",
  }[draftSaveStatus];

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
            onClick={handleFinishWorkout}
          >
            {isSaving ? (
              <LoaderCircle
                className="spin"
                size={17}
              />
            ) : (
              <Check size={17} />
            )}

            {isSaving ? "Finishing…" : "Finish workout"}
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
              local draft, but cloud drafts and finished
              sessions require an account.
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
        {weekDays.map((day) => {
          const dayState = getDayState(day);

          return (
            <button
              type="button"
              key={day}
              className={`day-selector__button day-selector__button--${dayState} ${
                selectedDay === day
                  ? "day-selector__button--active"
                  : ""
              }`}
              onClick={() => changeWorkoutDay(day)}
            >
              <span>
                {weekDayLabels[day].slice(0, 3)}
              </span>

              <small>
                {
                  workoutProgram[
                    workoutSchedule[day] ??
                      defaultWorkoutSchedule[day]
                  ].name
                }
              </small>
            </button>
          );
        })}
      </section>

      <section className="workout-progress-card">
        <div>
          <span>Workout progress</span>
          <strong>
            {isCompletionWorkout
              ? completedSets > 0
                ? "Walk completed"
                : "Walk not logged yet"
              : `${completedSets} of ${totalSets} sets logged`}
          </strong>
          <small>{draftStatusText}</small>
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
          const completionSet =
            workoutSets[exercise.id]?.[0];

          if (exercise.trackingType === "completion") {
            return (
              <article
                className="recovery-card"
                key={exercise.id}
              >
                <div className="recovery-card__content">
                  <span>{exercise.equipment}</span>
                  <h2>{exercise.name}</h2>
                  <p>{exercise.description}</p>
                </div>

                <button
                  type="button"
                  className={`recovery-card__toggle ${
                    completionSet?.completed
                      ? "recovery-card__toggle--active"
                      : ""
                  }`}
                  aria-pressed={Boolean(
                    completionSet?.completed,
                  )}
                  onClick={() =>
                    toggleCompletionExercise(exercise.id)
                  }
                >
                  <Check size={18} />
                  {completionSet?.completed
                    ? "Walked today"
                    : "Did you walk today?"}
                </button>
              </article>
            );
          }

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
              showRir={trackRir}
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
                                    trackRir &&
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
