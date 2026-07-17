import { supabase } from "./supabase";

function normalizeNullableNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function groupSetsBySession(sessions, sets) {
  const setsBySession = new Map();

  for (const set of sets) {
    const existingSets = setsBySession.get(set.session_id) ?? [];

    existingSets.push({
      id: set.id,
      setNumber: set.set_number,
      weight:
        set.weight === null || set.weight === undefined
          ? ""
          : String(set.weight),
      reps:
        set.reps === null || set.reps === undefined
          ? ""
          : String(set.reps),
      rir:
        set.rir === null || set.rir === undefined
          ? ""
          : String(set.rir),
      exerciseId: set.exercise_id,
      exerciseName: set.exercise_name,
    });

    setsBySession.set(set.session_id, existingSets);
  }

  return sessions.map((session) => {
    const sessionSets = setsBySession.get(session.id) ?? [];
    const exerciseMap = new Map();

    for (const set of sessionSets) {
      const existingExercise = exerciseMap.get(set.exerciseId) ?? {
        exerciseId: set.exerciseId,
        exerciseName: set.exerciseName,
        sets: [],
      };

      existingExercise.sets.push({
        id: set.id,
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
        rir: set.rir,
      });

      exerciseMap.set(set.exerciseId, existingExercise);
    }

    const exercises = Array.from(exerciseMap.values()).map(
      (exercise) => ({
        ...exercise,
        sets: exercise.sets.sort(
          (first, second) =>
            first.setNumber - second.setNumber,
        ),
      }),
    );

    return {
      id: session.id,
      date: session.workout_date,
      day: session.workout_day,
      workoutName: session.workout_name,
      notes: session.notes ?? "",
      exercises,
    };
  });
}

export async function ensureUserProfile(user) {
  if (!user) {
    throw new Error("A signed-in user is required.");
  }

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Member";

  const avatarUrl =
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    null;

  const { data: existingProfile, error: loadError } =
    await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", user.id)
      .maybeSingle();

  if (loadError) {
    throw new Error(
      `Unable to load profile: ${loadError.message}`,
    );
  }

  if (existingProfile) {
    const profileUpdate = {
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    };

    if (!existingProfile.display_name) {
      profileUpdate.display_name = displayName;
    }

    const { error } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (error) {
      throw new Error(
        `Unable to update profile: ${error.message}`,
      );
    }

    return;
  }

  const { error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(
      `Unable to create profile: ${error.message}`,
    );
  }
}

export async function saveWorkoutSession({
  userId,
  workoutDay,
  workoutName,
  workout,
  workoutSets,
  notes = "",
}) {
  if (!userId) {
    throw new Error("You must sign in before saving a workout.");
  }

  const completedSets = workout.exercises.flatMap((exercise) =>
    (workoutSets[exercise.id] ?? [])
      .filter(
        (set) => set.weight !== "" || set.reps !== "",
      )
      .map((set) => ({
        exercise,
        set,
      })),
  );

  if (completedSets.length === 0) {
    throw new Error(
      "Enter at least one completed set before saving.",
    );
  }

  const { data: session, error: sessionError } =
    await supabase
      .from("workout_sessions")
      .insert({
        user_id: userId,
        workout_date: new Date().toISOString(),
        workout_day: workoutDay,
        workout_name: workoutName,
        notes: notes || null,
      })
      .select("id, workout_date")
      .single();

  if (sessionError) {
    throw new Error(
      `Unable to save workout session: ${sessionError.message}`,
    );
  }

  const setRows = completedSets.map(({ exercise, set }) => ({
    session_id: session.id,
    user_id: userId,
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    set_number: set.setNumber,
    weight: normalizeNullableNumber(set.weight),
    reps: normalizeNullableNumber(set.reps),
    rir: normalizeNullableNumber(set.rir),
  }));

  const { error: setsError } = await supabase
    .from("workout_sets")
    .insert(setRows);

  if (setsError) {
    await supabase
      .from("workout_sessions")
      .delete()
      .eq("id", session.id)
      .eq("user_id", userId);

    throw new Error(
      `Unable to save workout sets: ${setsError.message}`,
    );
  }

  return session;
}

export async function getUserWorkoutHistory({
  userId,
  workoutDay,
  limit = 10,
}) {
  if (!userId) {
    return [];
  }

  let sessionsQuery = supabase
    .from("workout_sessions")
    .select(
      "id, workout_date, workout_day, workout_name, notes",
    )
    .eq("user_id", userId)
    .order("workout_date", { ascending: false })
    .limit(limit);

  if (workoutDay) {
    sessionsQuery = sessionsQuery.eq(
      "workout_day",
      workoutDay,
    );
  }

  const { data: sessions, error: sessionsError } =
    await sessionsQuery;

  if (sessionsError) {
    throw new Error(
      `Unable to load workout history: ${sessionsError.message}`,
    );
  }

  if (!sessions?.length) {
    return [];
  }

  const sessionIds = sessions.map((session) => session.id);

  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select(
      `
        id,
        session_id,
        exercise_id,
        exercise_name,
        set_number,
        weight,
        reps,
        rir
      `,
    )
    .eq("user_id", userId)
    .in("session_id", sessionIds)
    .order("set_number", { ascending: true });

  if (setsError) {
    throw new Error(
      `Unable to load workout sets: ${setsError.message}`,
    );
  }

  return groupSetsBySession(sessions, sets ?? []);
}

export async function deleteWorkoutSession({
  userId,
  sessionId,
}) {
  if (!userId || !sessionId) {
    throw new Error(
      "A user and workout session are required.",
    );
  }

  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(
      `Unable to delete workout: ${error.message}`,
    );
  }
}
