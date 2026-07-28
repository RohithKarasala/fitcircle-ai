import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { getExerciseGuide } from "../../data/exerciseLibrary";
import {
  formatSetPerformance,
  getDefaultResistanceType,
  getResistanceTypeLabel,
  getWeightFieldLabel,
  isBodyweightResistance,
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

function ExerciseCard({
  exercise,
  sets,
  previousSets,
  showRir = false,
  onSetsChange,
  onEdit,
  onSkip,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const guide = getExerciseGuide(exercise);
  const resistanceType =
    sets[0]?.resistanceType ??
    getDefaultResistanceType(exercise);
  const weightFieldLabel = getWeightFieldLabel(resistanceType);
  const usesBodyweight =
    isBodyweightResistance(resistanceType);
  const exerciseNote = sets[0]?.exerciseNote ?? "";
  const matchingPreviousSets = (previousSets ?? []).filter(
    (set) =>
      normalizeResistanceType(set.resistanceType) ===
      normalizeResistanceType(resistanceType),
  );

  const updateSet = (setId, field, value) => {
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
  };

  const updateExerciseNote = (value) => {
    onSetsChange(
      sets.map((set) => ({
        ...set,
        exerciseNote: value,
      })),
    );
  };

  const addSet = () => {
    onSetsChange([
      ...sets,
      createSet(sets.length + 1, resistanceType, exerciseNote),
    ]);
  };

  const removeSet = (setId) => {
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
              {getResistanceTypeLabel(resistanceType)}
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
              {[
                ...guide.primaryMuscles,
                ...guide.secondaryMuscles,
              ]
                .slice(0, 2)
                .join(" • ")}
            </p>
          )}
        </div>

        <div className="exercise-card__header-actions">
          {onEdit && (
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

          {onSkip && (
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

          {matchingPreviousSets.length > 0 && (
            <div className="previous-performance">
              <span>Previous</span>

              <div>
                {matchingPreviousSets.map((set) => (
                  <small key={set.setNumber}>
                    {formatSetPerformance(set, {
                      showRir,
                    })}
                  </small>
                ))}
              </div>
            </div>
          )}

          <ExerciseGuide guide={guide} />

          <div className="exercise-card__resistance">
            <div>
              <span>Resistance Type</span>
              <strong>
                {getResistanceTypeLabel(resistanceType)}
              </strong>
            </div>

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
                  aria-pressed={type.value === resistanceType}
                  onClick={() =>
                    updateResistanceType(type.value)
                  }
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`set-table ${
              showRir ? "" : "set-table--no-rir"
            }`}
          >
            <label className="exercise-note">
              <span>Variation note</span>
              <input
                value={exerciseNote}
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
                      placeholder={
                        matchingPreviousSets[set.setNumber - 1]
                          ?.weight ?? "0"
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
                    placeholder={
                      matchingPreviousSets[set.setNumber - 1]
                        ?.reps ?? "0"
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
                      placeholder="2"
                      onChange={(event) =>
                        updateSet(set.id, "rir", event.target.value)
                      }
                    />
                  </label>
                )}

                <button
                  type="button"
                  className="set-row__delete"
                  aria-label={`Remove set ${set.setNumber}`}
                  disabled={sets.length === 1}
                  onClick={() => removeSet(set.id)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={addSet}
          >
            <Plus size={17} />
            Add set
          </button>
        </div>
      )}
    </article>
  );
}

export default ExerciseCard;
