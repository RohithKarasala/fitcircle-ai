export const resistanceTypes = [
  {
    value: "bodyweight",
    label: "Bodyweight",
    weightLabel: "BW",
  },
  {
    value: "dumbbell",
    label: "Dumbbell",
    weightLabel: "Weight per hand",
  },
  {
    value: "barbell",
    label: "Barbell",
    weightLabel: "Total weight",
  },
  {
    value: "machine",
    label: "Machine",
    weightLabel: "Stack weight",
  },
  {
    value: "cable",
    label: "Cable",
    weightLabel: "Stack weight",
  },
  {
    value: "plate-loaded",
    label: "Plate Loaded",
    weightLabel: "Total loaded weight",
  },
  {
    value: "assisted",
    label: "Assisted",
    weightLabel: "Assistance",
  },
];

const resistanceTypeMap = Object.fromEntries(
  resistanceTypes.map((type) => [type.value, type]),
);

export function normalizeResistanceType(value) {
  return resistanceTypeMap[value]?.value ?? "machine";
}

export function getDefaultResistanceType(exercise = {}) {
  const text = `${exercise.equipment ?? ""} ${exercise.name ?? ""}`
    .toLowerCase()
    .trim();

  if (exercise.trackingType === "completion") {
    return "bodyweight";
  }

  if (text.includes("assisted")) {
    return "assisted";
  }

  if (text.includes("bodyweight")) {
    return "bodyweight";
  }

  if (text.includes("dumbbell")) {
    return "dumbbell";
  }

  if (text.includes("barbell")) {
    return "barbell";
  }

  if (text.includes("cable")) {
    return "cable";
  }

  if (text.includes("plate")) {
    return "plate-loaded";
  }

  return "machine";
}

export function getResistanceTypeLabel(value) {
  return (
    resistanceTypeMap[normalizeResistanceType(value)]?.label ??
    "Machine"
  );
}

export function getWeightFieldLabel(value) {
  return (
    resistanceTypeMap[normalizeResistanceType(value)]
      ?.weightLabel ?? "Weight"
  );
}

export function isBodyweightResistance(value) {
  return normalizeResistanceType(value) === "bodyweight";
}

export function isAssistedResistance(value) {
  return normalizeResistanceType(value) === "assisted";
}

export function toWorkoutNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

export function getSetExternalVolume(set = {}) {
  const resistanceType = normalizeResistanceType(
    set.resistanceType,
  );

  if (
    resistanceType === "bodyweight" ||
    resistanceType === "assisted"
  ) {
    return 0;
  }

  return (
    toWorkoutNumber(set.weight) * toWorkoutNumber(set.reps)
  );
}

export function getSessionExternalVolume(exercises = []) {
  return exercises.reduce(
    (exerciseTotal, exercise) =>
      exerciseTotal +
      (exercise.sets ?? []).reduce(
        (setTotal, set) =>
          setTotal + getSetExternalVolume(set),
        0,
      ),
    0,
  );
}

export function getCompletedSetCountFromExercises(
  exercises = [],
) {
  return exercises.reduce(
    (total, exercise) =>
      total +
      (exercise.sets ?? []).filter(
        (set) =>
          Boolean(set.completed) ||
          toWorkoutNumber(set.weight) > 0 ||
          toWorkoutNumber(set.reps) > 0,
      ).length,
    0,
  );
}

export function formatSetPerformance(
  set = {},
  { showRir = false } = {},
) {
  const resistanceType = normalizeResistanceType(
    set.resistanceType,
  );
  const reps = set.reps || "—";
  const rir =
    showRir && set.rir !== "" && set.rir !== undefined
      ? ` · ${set.rir} RIR`
      : "";

  if (resistanceType === "bodyweight") {
    return `BW × ${reps}${rir}`;
  }

  if (resistanceType === "assisted") {
    return `${set.weight || "—"} lb assistance × ${reps}${rir}`;
  }

  return `${set.weight || "—"} lb × ${reps}${rir}`;
}
