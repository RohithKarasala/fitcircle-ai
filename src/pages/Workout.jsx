import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  LoaderCircle,
  LogIn,
  Plus,
  RotateCcw,
  Share2,
  X,
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
const DEFAULT_EXERCISE_FORM = {
  name: "",
  equipment: "Machine",
  sets: "3",
  repRange: "8-12",
  restSeconds: "60",
  description: "Log the sets you perform today.",
};

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

function resizeExerciseSets(currentSets, setCount) {
  const nextSetCount = Math.max(Number(setCount) || 1, 1);
  const existingSets = currentSets ?? [];

  return Array.from({ length: nextSetCount }, (_, index) => {
    const existingSet = existingSets[index];

    return existingSet
      ? {
          ...existingSet,
          setNumber: index + 1,
        }
      : {
          id: crypto.randomUUID(),
          setNumber: index + 1,
          weight: "",
          reps: "",
          rir: "",
        };
  });
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

function getDraftForKey(draftKey, workout) {
  const drafts = getDrafts();
  const draft = drafts[draftKey];
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

function getLocalWorkoutForKey(draftKey, fallbackWorkout) {
  const drafts = getDrafts();
  const draftWorkout = drafts[draftKey]?.workout;

  return draftWorkout?.exercises?.length
    ? draftWorkout
    : fallbackWorkout;
}

function saveDraftForKey(draftKey, workoutSets, workout) {
  const drafts = getDrafts();

  drafts[draftKey] = {
    savedAt: new Date().toISOString(),
    workout,
    workoutSets,
  };

  localStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify(drafts),
  );
}

function clearDraftForKey(draftKey) {
  const drafts = getDrafts();

  delete drafts[draftKey];

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

function getWorkoutFromDraft(draft, fallbackWorkout) {
  const draftWorkout = draft?.workoutPayload?.workout;

  return draftWorkout?.exercises?.length
    ? draftWorkout
    : fallbackWorkout;
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

function getTodayKey() {
  return getDateKey(new Date());
}

function getDateFromKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function shiftDateKey(dateKey, amount) {
  const date = getDateFromKey(dateKey);
  date.setDate(date.getDate() + amount);

  return getDateKey(date);
}

function getWeekDateKeys(dateKey) {
  const weekStart = getWeekStart(getDateFromKey(dateKey));

  if (!weekStart) {
    return weekDays.map((_, index) =>
      shiftDateKey(getTodayKey(), index),
    );
  }

  return weekDays.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);

    return getDateKey(date);
  });
}

function getFinishedDates(sessions) {
  return new Set(
    sessions.map((session) => getDateKey(session.date)),
  );
}

function formatShortDate(dateKey) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(getDateFromKey(dateKey));
}

function formatWeekRange(dateKeys) {
  const firstDate = dateKeys[0];
  const lastDate = dateKeys[dateKeys.length - 1];

  return `${formatShortDate(firstDate)} - ${formatShortDate(lastDate)}`;
}

function isSameWorkout(firstWorkout, secondWorkout) {
  return (
    JSON.stringify(firstWorkout) ===
    JSON.stringify(secondWorkout)
  );
}

function getExerciseFormFromExercise(exercise) {
  if (!exercise) {
    return DEFAULT_EXERCISE_FORM;
  }

  return {
    name: exercise.name,
    equipment: exercise.equipment,
    sets: String(exercise.sets),
    repRange: exercise.repRange,
    restSeconds: String(exercise.restSeconds),
    description: exercise.description,
  };
}

function normalizeExerciseForm(form) {
  const name = form.name.trim();

  if (!name) {
    throw new Error("Exercise name is required.");
  }

  return {
    name,
    equipment: form.equipment.trim() || "Machine",
    sets: Math.max(Number(form.sets) || 1, 1),
    repRange: form.repRange.trim() || "8-12",
    restSeconds: Math.max(Number(form.restSeconds) || 0, 0),
    description:
      form.description.trim() ||
      "Log the sets you perform today.",
  };
}

function ExerciseEditorModal({
  mode,
  form,
  error,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!mode) {
    return null;
  }

  const title =
    mode === "add" ? "Add exercise" : "Edit exercise";
  const actionLabel =
    mode === "add" ? "Add exercise" : "Save exercise";

  return (
    <div className="workout-modal-backdrop">
      <section
        className="workout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-editor-title"
      >
        <div className="workout-modal__header">
          <div>
            <p className="eyebrow">Today only</p>
            <h2 id="exercise-editor-title">{title}</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            aria-label="Close exercise editor"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="workout-modal__form"
          onSubmit={onSubmit}
        >
          <label>
            <span>Exercise name</span>
            <input
              value={form.name}
              onChange={(event) =>
                onChange("name", event.target.value)
              }
              placeholder="Bicep Curl"
            />
          </label>

          <label>
            <span>Equipment</span>
            <input
              value={form.equipment}
              onChange={(event) =>
                onChange("equipment", event.target.value)
              }
              placeholder="Cable, dumbbells, machine"
            />
          </label>

          <div className="workout-modal__grid">
            <label>
              <span>Sets</span>
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.sets}
                onChange={(event) =>
                  onChange("sets", event.target.value)
                }
              />
            </label>

            <label>
              <span>Rep range</span>
              <input
                value={form.repRange}
                onChange={(event) =>
                  onChange("repRange", event.target.value)
                }
                placeholder="8-12"
              />
            </label>

            <label>
              <span>Rest seconds</span>
              <input
                type="number"
                min="0"
                step="15"
                inputMode="numeric"
                value={form.restSeconds}
                onChange={(event) =>
                  onChange("restSeconds", event.target.value)
                }
              />
            </label>
          </div>

          <label>
            <span>Notes</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                onChange("description", event.target.value)
              }
              placeholder="Cue, setup, or substitute details"
            />
          </label>

          {error && (
            <p className="workout-modal__error">{error}</p>
          )}

          <div className="workout-modal__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-action-button"
            >
              <Check size={17} />
              {actionLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function getLocalDraftDates(workoutSchedule, weekDateKeys) {
  return new Set(
    weekDateKeys.filter((dateKey) => {
      const day = getWeekdayKey(getDateFromKey(dateKey));
      const workoutKey =
        workoutSchedule[day] ?? defaultWorkoutSchedule[day];
      const baseWorkout = workoutProgram[workoutKey];
      const draftWorkout = getLocalWorkoutForKey(
        dateKey,
        baseWorkout,
      );
      const draftSets = getDraftForKey(dateKey, draftWorkout);

      return (
        hasWorkoutEntries(draftSets) ||
        !isSameWorkout(draftWorkout, baseWorkout)
      );
    }),
  );
}

function Workout() {
  const { user, isLoading: isAuthLoading, signInWithGoogle } =
    useAuth();

  const todayKey = getTodayKey();
  const initialDay = getWeekdayKey();
  const initialDate = todayKey;

  const [selectedDate, setSelectedDate] =
    useState(initialDate);
  const [selectedDay, setSelectedDay] =
    useState(initialDay);
  const [workoutSchedule, setWorkoutSchedule] = useState(
    defaultWorkoutSchedule,
  );
  const initialWorkoutKey =
    workoutSchedule[initialDay] ?? initialDay;
  const initialWorkout = getLocalWorkoutForKey(
    initialDate,
    workoutProgram[initialWorkoutKey],
  );

  const [workoutSets, setWorkoutSets] = useState(() =>
    getDraftForKey(initialDate, initialWorkout),
  );
  const [customWorkout, setCustomWorkout] = useState(
    initialWorkout,
  );

  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [remoteDraftsByDate, setRemoteDraftsByDate] =
    useState({});
  const [hasLoadedRemoteDrafts, setHasLoadedRemoteDrafts] =
    useState(false);
  const [finishedDates, setFinishedDates] = useState(new Set());
  const [draftSaveStatus, setDraftSaveStatus] =
    useState("idle");
  const [sharingSessionId, setSharingSessionId] =
    useState("");
  const [shareGroupIds, setShareGroupIds] = useState({});
  const [trackRir, setTrackRir] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [exerciseEditorMode, setExerciseEditorMode] =
    useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [exerciseForm, setExerciseForm] = useState(
    DEFAULT_EXERCISE_FORM,
  );
  const [exerciseFormError, setExerciseFormError] =
    useState("");
  const appliedScheduleUserIdRef = useRef("");

  const selectedWorkoutKey =
    workoutSchedule[selectedDay] ??
    defaultWorkoutSchedule[selectedDay];
  const baseWorkout = workoutProgram[selectedWorkoutKey];
  const workout = customWorkout ?? baseWorkout;
  const isCompletionWorkout = workout.exercises.every(
    (exercise) => exercise.trackingType === "completion",
  );
  const selectedWeekDateKeys = useMemo(
    () => getWeekDateKeys(selectedDate),
    [selectedDate],
  );
  const currentWeekStartKey = getWeekDateKeys(todayKey)[0];
  const selectedWeekStartKey = selectedWeekDateKeys[0];
  const canMoveToNextWeek =
    selectedWeekStartKey < currentWeekStartKey;
  const localDraftDates = useMemo(
    () =>
      getLocalDraftDates(
        workoutSchedule,
        selectedWeekDateKeys,
      ),
    [selectedWeekDateKeys, workoutSchedule],
  );
  const selectedDayHasEntries =
    hasWorkoutEntries(workoutSets);
  const selectedWorkoutChanged = !isSameWorkout(
    workout,
    baseWorkout,
  );

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
        const todayDate = getTodayKey();
        const today = getWeekdayKey();
        const scheduledWorkoutKey = getTodayWorkoutKey(
          schedule,
        );
        const todayWorkout = getLocalWorkoutForKey(
          todayDate,
          workoutProgram[scheduledWorkoutKey],
        );

        setTrackRir(Boolean(profile?.trackRir));
        setWorkoutSchedule(schedule);
        setSelectedDate(todayDate);
        setSelectedDay(today);
        setCustomWorkout(todayWorkout);
        setWorkoutSets(
          getDraftForKey(todayDate, todayWorkout),
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
      setRemoteDraftsByDate({});
      setFinishedDates(new Set());
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
        drafts.map((draft) => [
          draft.workoutDate ?? draft.workoutDay,
          draft,
        ]),
      );

      setRemoteDraftsByDate(draftMap);
      setFinishedDates(getFinishedDates(sessions));
      setHasLoadedRemoteDrafts(true);

      const selectedDraft =
        draftMap[selectedDate] ?? draftMap[selectedDay];

      if (selectedDraft) {
        const selectedDraftWorkoutKey =
          workoutSchedule[selectedDay] ??
          defaultWorkoutSchedule[selectedDay];
        const draftWorkout = getWorkoutFromDraft(
          selectedDraft,
          workoutProgram[selectedDraftWorkoutKey],
        );

        setCustomWorkout(draftWorkout);
        setWorkoutSets((current) => {
          const draftWorkoutSets = getWorkoutStateFromDraft(
            selectedDraft,
            draftWorkout,
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
  }, [selectedDate, selectedDay, user, workoutSchedule]);

  useEffect(() => {
    Promise.resolve().then(loadWorkoutStatus);
  }, [loadWorkoutStatus]);

  useEffect(() => {
    saveDraftForKey(selectedDate, workoutSets, workout);
  }, [selectedDate, workout, workoutSets]);

  useEffect(() => {
    if (!user || !hasLoadedRemoteDrafts) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setDraftSaveStatus("saving");

        if (
          !selectedDayHasEntries &&
          !selectedWorkoutChanged
        ) {
          await deleteWorkoutDraft({
            userId: user.id,
            workoutDay: selectedDay,
            workoutDate: selectedDate,
          });

          setRemoteDraftsByDate((current) => {
            const nextDrafts = { ...current };
            delete nextDrafts[selectedDate];
            return nextDrafts;
          });
          setDraftSaveStatus("idle");
          return;
        }

        const savedDraft = await upsertWorkoutDraft({
          userId: user.id,
          workoutDay: selectedDay,
          workoutDate: selectedDate,
          workoutName: workout.name,
          workoutKey: selectedWorkoutKey,
          workout,
          workoutSets,
        });

        setRemoteDraftsByDate((current) => ({
          ...current,
          [selectedDate]: savedDraft,
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
    selectedDate,
    selectedDay,
    selectedDayHasEntries,
    selectedWorkoutChanged,
    selectedWorkoutKey,
    user,
    workout,
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

  const changeWorkoutDate = (dateKey) => {
    const day = getWeekdayKey(getDateFromKey(dateKey));
    const nextWorkoutKey =
      workoutSchedule[day] ?? defaultWorkoutSchedule[day];
    const baseNextWorkout = workoutProgram[nextWorkoutKey];
    const remoteDraft =
      remoteDraftsByDate[dateKey] ?? remoteDraftsByDate[day];
    const nextWorkout = remoteDraft
      ? getWorkoutFromDraft(remoteDraft, baseNextWorkout)
      : getLocalWorkoutForKey(dateKey, baseNextWorkout);

    setSelectedDate(dateKey);
    setSelectedDay(day);
    setCustomWorkout(nextWorkout);
    setWorkoutSets(
      remoteDraft
        ? getWorkoutStateFromDraft(remoteDraft, nextWorkout)
        : getDraftForKey(dateKey, nextWorkout),
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

  const closeExerciseEditor = () => {
    setExerciseEditorMode(null);
    setEditingExercise(null);
    setExerciseForm(DEFAULT_EXERCISE_FORM);
    setExerciseFormError("");
  };

  const updateExerciseForm = (field, value) => {
    setExerciseForm((current) => ({
      ...current,
      [field]: value,
    }));
    setExerciseFormError("");
  };

  const openEditExercise = (exercise) => {
    setExerciseEditorMode("edit");
    setEditingExercise(exercise);
    setExerciseForm(getExerciseFormFromExercise(exercise));
    setExerciseFormError("");
  };

  const openAddExercise = () => {
    setExerciseEditorMode("add");
    setEditingExercise(null);
    setExerciseForm(DEFAULT_EXERCISE_FORM);
    setExerciseFormError("");
  };

  const submitExerciseEditor = (event) => {
    event.preventDefault();

    let normalizedExercise;

    try {
      normalizedExercise = normalizeExerciseForm(exerciseForm);
    } catch (error) {
      setExerciseFormError(error.message);
      return;
    }

    if (exerciseEditorMode === "edit" && editingExercise) {
      const updatedExercise = {
        ...editingExercise,
        ...normalizedExercise,
      };

      setCustomWorkout((current) => ({
        ...current,
        exercises: current.exercises.map((item) =>
          item.id === editingExercise.id
            ? updatedExercise
            : item,
        ),
      }));
      setWorkoutSets((current) => ({
        ...current,
        [editingExercise.id]: resizeExerciseSets(
          current[editingExercise.id],
          normalizedExercise.sets,
        ),
      }));
      setStatusMessage("Exercise updated for this workout.");
    }

    if (exerciseEditorMode === "add") {
      const exercise = {
        id: `custom-${crypto.randomUUID()}`,
        ...normalizedExercise,
        custom: true,
      };

      setCustomWorkout((current) => ({
        ...current,
        exercises: [...current.exercises, exercise],
      }));
      setWorkoutSets((current) => ({
        ...current,
        [exercise.id]: createExerciseSets(exercise),
      }));
      setStatusMessage("Exercise added for this workout.");
    }

    setErrorMessage("");
    closeExerciseEditor();
  };

  const skipExercise = (exercise) => {
    const confirmed = window.confirm(
      `Skip ${exercise.name} for this workout?`,
    );

    if (!confirmed) {
      return;
    }

    setCustomWorkout((current) => ({
      ...current,
      exercises: current.exercises.filter(
        (item) => item.id !== exercise.id,
      ),
    }));
    setWorkoutSets((current) => {
      const nextSets = { ...current };
      delete nextSets[exercise.id];
      return nextSets;
    });
    setStatusMessage("Exercise skipped for this workout.");
    setErrorMessage("");
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

    clearDraftForKey(selectedDate);
    setCustomWorkout(baseWorkout);
    setWorkoutSets(createWorkoutState(baseWorkout));
    setRemoteDraftsByDate((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[selectedDate];
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
          workoutDate: selectedDate,
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
        workoutDate: selectedDate,
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

      clearDraftForKey(selectedDate);
      await deleteWorkoutDraft({
        userId: user.id,
        workoutDay: selectedDay,
        workoutDate: selectedDate,
      });
      setRemoteDraftsByDate((current) => {
        const nextDrafts = { ...current };
        delete nextDrafts[selectedDate];
        return nextDrafts;
      });
      setFinishedDates((current) => {
        const nextDates = new Set(current);
        nextDates.add(selectedDate);
        return nextDates;
      });
      setCustomWorkout(baseWorkout);
      setWorkoutSets(createWorkoutState(baseWorkout));
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
  const selectedDayFinished = finishedDates.has(selectedDate);
  const getDateState = (dateKey) => {
    const day = getWeekdayKey(getDateFromKey(dateKey));

    if (finishedDates.has(dateKey)) {
      return "finished";
    }

    if (
      (dateKey === selectedDate && selectedDayHasEntries) ||
      (dateKey === selectedDate && selectedWorkoutChanged) ||
      remoteDraftsByDate[dateKey] ||
      remoteDraftsByDate[day] ||
      localDraftDates.has(dateKey)
    ) {
      return "draft";
    }

    return "idle";
  };

  const draftStatusText = {
    idle: selectedDayFinished
      ? "Completed"
      : selectedDayHasEntries
      ? "Draft saved locally"
      : selectedWorkoutChanged
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
            disabled={
              isSaving || isAuthLoading || selectedDayFinished
            }
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

            {selectedDayFinished
              ? "Finished"
              : isSaving
              ? "Finishing…"
              : "Finish workout"}
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

      <section className="workout-week-control">
        <button
          type="button"
          aria-label="View previous week"
          onClick={() =>
            changeWorkoutDate(shiftDateKey(selectedDate, -7))
          }
        >
          <ChevronLeft size={18} />
        </button>

        <div>
          <CalendarDays size={18} />
          <span>{formatWeekRange(selectedWeekDateKeys)}</span>
        </div>

        <button
          type="button"
          aria-label="View next week"
          disabled={!canMoveToNextWeek}
          onClick={() =>
            changeWorkoutDate(shiftDateKey(selectedDate, 7))
          }
        >
          <ChevronRight size={18} />
        </button>
      </section>

      <section
        className="day-selector"
        aria-label="Select workout day"
      >
        {selectedWeekDateKeys.map((dateKey) => {
          const day = getWeekdayKey(getDateFromKey(dateKey));
          const dayState = getDateState(dateKey);

          return (
            <button
              type="button"
              key={dateKey}
              className={`day-selector__button day-selector__button--${dayState} ${
                selectedDate === dateKey
                  ? "day-selector__button--active"
                  : ""
              }`}
              onClick={() => changeWorkoutDate(dateKey)}
            >
              <span>
                {weekDayLabels[day].slice(0, 3)}
              </span>

              <em>{formatShortDate(dateKey)}</em>

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
            {selectedDayFinished
              ? "Workout finished"
              : isCompletionWorkout
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
              onEdit={() => openEditExercise(exercise)}
              onSkip={() => skipExercise(exercise)}
            />
          );
        })}

        {!isCompletionWorkout && (
          <button
            type="button"
            className="secondary-button workout-page__add-exercise"
            onClick={openAddExercise}
          >
            <Plus size={17} />
            Add exercise
          </button>
        )}
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

      <ExerciseEditorModal
        mode={exerciseEditorMode}
        form={exerciseForm}
        error={exerciseFormError}
        onChange={updateExerciseForm}
        onClose={closeExerciseEditor}
        onSubmit={submitExerciseEditor}
      />
    </div>
  );
}

export default Workout;
