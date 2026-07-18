import { supabase } from "./supabase";

export const defaultNutritionTargets = {
  calories: 2200,
  protein: 160,
  fiber: 30,
  water: 100,
};

export const emptyNutritionEntry = {
  name: "",
  calories: "",
  protein: "",
  fiber: "",
  water: "",
};

function normalizeNumber(value, label, { min = 0, max } = {}) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Enter a valid ${label}.`);
  }

  if (number < min || (max !== undefined && number > max)) {
    throw new Error(
      `${label} must be between ${min} and ${max}.`,
    );
  }

  return Math.round(number * 10) / 10;
}

function normalizeTargets(targets) {
  return {
    calories:
      normalizeNumber(targets.calories, "calorie target", {
        max: 10000,
      }) ?? defaultNutritionTargets.calories,
    protein:
      normalizeNumber(targets.protein, "protein target", {
        max: 500,
      }) ?? defaultNutritionTargets.protein,
    fiber:
      normalizeNumber(targets.fiber, "fiber target", {
        max: 150,
      }) ?? defaultNutritionTargets.fiber,
    water:
      normalizeNumber(targets.water, "water target", {
        max: 400,
      }) ?? defaultNutritionTargets.water,
  };
}

function normalizeEntry(entry) {
  const name =
    typeof entry.name === "string" ? entry.name.trim() : "";

  if (!name) {
    throw new Error("Food name is required.");
  }

  if (name.length > 120) {
    throw new Error("Food name cannot exceed 120 characters.");
  }

  return {
    name,
    calories: normalizeNumber(entry.calories, "calories", {
      max: 10000,
    }),
    protein: normalizeNumber(entry.protein, "protein", {
      max: 500,
    }),
    fiber: normalizeNumber(entry.fiber, "fiber", {
      max: 150,
    }),
    water: normalizeNumber(entry.water, "water", {
      max: 400,
    }),
  };
}

function mapTargets(row) {
  if (!row) {
    return defaultNutritionTargets;
  }

  return {
    calories: row.calorie_target ?? defaultNutritionTargets.calories,
    protein: row.protein_target_g ?? defaultNutritionTargets.protein,
    fiber: row.fiber_target_g ?? defaultNutritionTargets.fiber,
    water: row.water_target_oz ?? defaultNutritionTargets.water,
  };
}

function mapEntry(row) {
  return {
    id: row.id,
    name: row.name,
    calories: row.calories ?? "",
    protein: row.protein_g ?? "",
    fiber: row.fiber_g ?? "",
    water: row.water_oz ?? "",
  };
}

export function getTodayKey() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10);
}

export async function getNutritionDay({
  userId,
  date = getTodayKey(),
}) {
  if (!userId) {
    return {
      targets: defaultNutritionTargets,
      entries: [],
    };
  }

  const [targetsResult, entriesResult] =
    await Promise.all([
      supabase
        .from("nutrition_targets")
        .select(
          "calorie_target, protein_target_g, fiber_target_g, water_target_oz",
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("nutrition_entries")
        .select(
          "id, name, calories, protein_g, fiber_g, water_oz, created_at",
        )
        .eq("user_id", userId)
        .eq("log_date", date)
        .order("created_at", { ascending: true }),
    ]);

  if (targetsResult.error) {
    throw new Error(
      `Unable to load nutrition targets: ${targetsResult.error.message}`,
    );
  }

  if (entriesResult.error) {
    throw new Error(
      `Unable to load nutrition entries: ${entriesResult.error.message}`,
    );
  }

  return {
    targets: mapTargets(targetsResult.data),
    entries: (entriesResult.data ?? []).map(mapEntry),
  };
}

export async function saveNutritionTargets({
  userId,
  targets,
}) {
  if (!userId) {
    throw new Error("Sign in before saving targets.");
  }

  const normalizedTargets = normalizeTargets(targets);

  const { data, error } = await supabase
    .from("nutrition_targets")
    .upsert(
      {
        user_id: userId,
        calorie_target: normalizedTargets.calories,
        protein_target_g: normalizedTargets.protein,
        fiber_target_g: normalizedTargets.fiber,
        water_target_oz: normalizedTargets.water,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )
    .select(
      "calorie_target, protein_target_g, fiber_target_g, water_target_oz",
    )
    .single();

  if (error) {
    throw new Error(
      `Unable to save nutrition targets: ${error.message}`,
    );
  }

  return mapTargets(data);
}

export async function addNutritionEntry({
  userId,
  date = getTodayKey(),
  entry,
}) {
  if (!userId) {
    throw new Error("Sign in before adding nutrition.");
  }

  const normalizedEntry = normalizeEntry(entry);

  const { data, error } = await supabase
    .from("nutrition_entries")
    .insert({
      user_id: userId,
      log_date: date,
      name: normalizedEntry.name,
      calories: normalizedEntry.calories,
      protein_g: normalizedEntry.protein,
      fiber_g: normalizedEntry.fiber,
      water_oz: normalizedEntry.water,
    })
    .select("id, name, calories, protein_g, fiber_g, water_oz")
    .single();

  if (error) {
    throw new Error(
      `Unable to add nutrition entry: ${error.message}`,
    );
  }

  return mapEntry(data);
}

export async function deleteNutritionEntry({
  userId,
  entryId,
}) {
  if (!userId || !entryId) {
    throw new Error("A nutrition entry is required.");
  }

  const { error } = await supabase
    .from("nutrition_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(
      `Unable to delete nutrition entry: ${error.message}`,
    );
  }
}
