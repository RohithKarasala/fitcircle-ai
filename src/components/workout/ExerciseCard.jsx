import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getExerciseGuide } from "../../data/exerciseLibrary";
import {
  formatSetPerformance,
  getDefaultResistanceType,
  getResistanceTypeLabel,
  getWeightFieldLabel,
  isBodyweightResistance,
  isWorkoutSetComplete,
  isWorkoutSetLogged,
  normalizeResistanceType,
  resistanceTypes,
} from "../../utils/workoutMetrics";
import ExerciseGuide from "./ExerciseGuide";

function createSet(setNumber, resistanceType, exerciseNote = "") {
  return {
    id: crypto.randomUUID(),
    setNumber,
    weight: "",
    reps: "",
    rir: "",
    resistanceType,
    exerciseNote,
  };
}

function hasSetEnteredValues(set = {}) {
  return isWorkoutSetLogged(set) || set.rir !== "";
}

function getGuideSummaryParts(guide) {
  const seenParts = new Set();

  return [
    guide.category,
    ...guide.primaryMuscles,
    ...guide.secondaryMuscles,
  ].filter((part) => {
    const normalizedPart = part?.trim().toLowerCase();

    if (!normalizedPart || seenParts.has(normalizedPart)) {
      return false;
    }

    seenParts.add(normalizedPart);
    return true;
  });
}

function ExerciseCard({
  exercise,
  sets,
  previousSets,
  showRir = false,
  showGuide = true,
  autoCollapseOnComplete = false,
  onSetsChange,
  onEdit,
  onSkip,
  readOnly = false,
  hidePrevious = false,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isResistanceOpen, setIsResistanceOpen] =
    useState(false);
  const guide = getExerciseGuide(exercise);
  const guideSummaryParts = guide
    ? getGuideSummaryParts(guide)
    : [];
  const resistanceType =
    sets[0]?.resistanceType ??
    getDefaultResistanceType(exercise);
  const resistanceTypeLabel =
    getResistanceTypeLabel(resistanceType);
  const weightFieldLabel = getWeightFieldLabel(resistanceType);
  const usesBodyweight =
    isBodyweightResistance(resistanceType);
  const exerciseNote = sets[0]?.exerciseNote ?? "";
  const loggedSetCount = sets.filter(isWorkoutSetComplete).length;
  const isComplete =
    sets.length > 0 && loggedSetCount >= sets.length;
  const wasCompleteRef = useRef(isComplete);
  const nextSetNumber =
    sets.find((set) => !isWorkoutSetComplete(set))?.setNumber ??
    sets.length;
  const stickyContextText =
    loggedSetCount >= sets.length
      ? `${loggedSetCount} of ${sets.length} sets logged`
      : `Set ${nextSetNumber} of ${sets.length}`;
  const matchingPreviousSets = (previousSets ?? []).filter(
    (set) =>
      normalizeResistanceType(set.resistanceType) ===
      normalizeResistanceType(resistanceType),
  );

  useEffect(() => {
    if (
      autoCollapseOnComplete &&
      isComplete &&
      !wasCompleteRef.current
    ) {
      setIsExpanded(false);
    }

    wasCompleteRef.current = isComplete;
  }, [autoCollapseOnComplete, isComplete]);

  const updateSet = (setId, field, value) => {
    if (readOnly) {
      return;
    }

    onSetsChange(
      sets.map((set) =>
        set.id === setId
          ? {
              ...set,
              [field]: value,
            }
          : set,
      ),
    );
  };

  const updateResistanceType = (value) => {
    if (readOnly) {
      return;
    }

    const isSameResistanceType =
      normalizeResistanceType(value) ===
      normalizeResistanceType(resistanceType);

    onSetsChange(
      sets.map((set) => ({
        ...set,
        resistanceType: value,
        weight:
          isBodyweightResistance(value) ||
          !isSameResistanceType
            ? ""
            : set.weight,
      })),
    );
    setIsResistanceOpen(false);
  };

  const updateExerciseNote = (value) => {
    if (readOnly) {
      return;
    }

    onSetsChange(
      sets.map((set) => ({
        ...set,
        exerciseNote: value,
      })),
    );
  };

  const addSet = () => {
    if (readOnly) {
      return;
    }

    onSetsChange([
      ...sets,
      createSet(sets.length + 1, resistanceType, exerciseNote),
    ]);
  };

  const removeSet = (setId) => {
    if (readOnly) {
      return;
    }

    const targetSet = sets.find((set) => set.id === setId);

    if (
      hasSetEnteredValues(targetSet) &&
      !window.confirm(
        `Remove set ${targetSet.setNumber}? Logged values for this set will be deleted.`,
      )
    ) {
      return;
    }

    const updatedSets = sets
      .filter((set) => set.id !== setId)
      .map((set, index) => ({
        ...set,
        setNumber: index + 1,
      }));

    onSetsChange(updatedSets);
  };

  return (
    <article className="exercise-card">
      <button
        type="button"
        className="exercise-card__header"
        onClick={() => setIsExpanded((current) => !current)}
      >
        <div>
          <div className="exercise-card__badges">
            <span className="exercise-card__equipment">
              {resistanceTypeLabel}
            </span>

            {exercise.optional && (
              <span className="exercise-card__optional">
                Optional
              </span>
            )}
          </div>

          <h2>{exercise.name}</h2>

          <p>
            {exercise.sets} sets × {exercise.repRange} reps ·{" "}
            {exercise.restSeconds}s rest
          </p>

          {guide && (
            <p className="exercise-card__guide-summary">
              {exercise.sets} sets • {guide.category} •{" "}
              {guideSummaryParts.slice(1, 3).join(" • ")}
            </p>
          )}
        </div>

        <div className="exercise-card__header-actions">
          {onEdit && !readOnly && (
            <span
              className="exercise-card__icon-action"
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  event.stopPropagation();
                  onEdit();
                }
              }}
            >
              <Pencil size={16} />
              <span className="sr-only">Edit exercise</span>
            </span>
          )}

          {onSkip && !readOnly && (
            <span
              className="exercise-card__icon-action exercise-card__icon-action--danger"
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onSkip();
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  event.stopPropagation();
                  onSkip();
                }
              }}
            >
              <Trash2 size={16} />
              <span className="sr-only">Skip exercise</span>
            </span>
          )}

          {isExpanded ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="exercise-card__body">
          <p className="exercise-description">{exercise.description}</p>

          {!hidePrevious && (
            <div
              className={
                matchingPreviousSets.length > 0
                  ? "previous-performance"
                  : "previous-performance previous-performance--empty"
              }
            >
              <span>Previous: {resistanceTypeLabel}</span>

              {matchingPreviousSets.length > 0 ? (
                <div>
                  {matchingPreviousSets.map((set) => (
                    <small key={set.setNumber}>
                      {formatSetPerformance(set, {
                        showRir,
                      })}
                    </small>
                  ))}
                </div>
              ) : (
                <small>
                  No previous {resistanceTypeLabel.toLowerCase()}{" "}
                  sets yet
                </small>
              )}
            </div>
          )}

          {showGuide && <ExerciseGuide guide={guide} />}

          <div className="exercise-card__resistance">
            <button
              type="button"
              className="exercise-card__resistance-summary"
              aria-expanded={isResistanceOpen}
              disabled={readOnly}
              onClick={() =>
                setIsResistanceOpen((current) => !current)
              }
            >
              <span>Resistance Type</span>
              <strong>
                {resistanceTypeLabel}
              </strong>
              {isResistanceOpen ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {isResistanceOpen && !readOnly && (
              <div className="exercise-card__resistance-options">
                {resistanceTypes.map((type) => (
                  <button
                    type="button"
                    key={type.value}
                    className={
                      type.value === resistanceType
                        ? "exercise-card__resistance-option exercise-card__resistance-option--active"
                        : "exercise-card__resistance-option"
                    }
                    aria-pressed={
                      type.value === resistanceType
                    }
                    onClick={() =>
                      updateResistanceType(type.value)
                    }
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className={`set-table ${
              showRir ? "" : "set-table--no-rir"
            }`}
          >
            <div className="exercise-card__sticky-context">
              <strong>{exercise.name}</strong>
              <span>{stickyContextText}</span>
            </div>

            <label className="exercise-note">
              <span>Variation note</span>
              <input
                value={exerciseNote}
                disabled={readOnly}
                onChange={(event) =>
                  updateExerciseNote(event.target.value)
                }
                placeholder="Wide grip, smith machine, rope, feet high..."
              />
            </label>

            <div className="set-table__header">
              <span>Set</span>
              <span>{weightFieldLabel}</span>
              <span>Reps</span>
              {showRir && <span>RIR</span>}
              <span />
            </div>

            {sets.map((set) => (
              <div className="set-row" key={set.id}>
                <strong>{set.setNumber}</strong>

                <label>
                  <span className="sr-only">
                    Set {set.setNumber} {weightFieldLabel}
                  </span>
                  {usesBodyweight ? (
                    <div className="set-row__bodyweight">BW</div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="2.5"
                      inputMode="decimal"
                      value={set.weight}
                      disabled={readOnly}
                      placeholder={
                        matchingPreviousSets[set.setNumber - 1]
                          ?.weight ?? ""
                      }
                      onChange={(event) =>
                        updateSet(
                          set.id,
                          "weight",
                          event.target.value,
                        )
                      }
                    />
                  )}
                </label>

                <label>
                  <span className="sr-only">
                    Set {set.setNumber} repetitions
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={set.reps}
                    disabled={readOnly}
                    placeholder={
                      matchingPreviousSets[set.setNumber - 1]
                        ?.reps ?? ""
                    }
                    onChange={(event) =>
                      updateSet(set.id, "reps", event.target.value)
                    }
                  />
                </label>

                {showRir && (
                  <label>
                    <span className="sr-only">
                      Set {set.setNumber} repetitions in reserve
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="1"
                      inputMode="numeric"
                      value={set.rir}
                      disabled={readOnly}
                      placeholder="2"
                      onChange={(event) =>
                        updateSet(set.id, "rir", event.target.value)
                      }
                    />
                  </label>
                )}

                {readOnly ? (
                  <span />
                ) : (
                  <button
                    type="button"
                    className="set-row__delete"
                    aria-label={`Remove set ${set.setNumber}`}
                    disabled={sets.length === 1}
                    onClick={() => removeSet(set.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {!readOnly && (
            <button
              type="button"
              className="secondary-button"
              onClick={addSet}
            >
              <Plus size={17} />
              Add set
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default ExerciseCard;
