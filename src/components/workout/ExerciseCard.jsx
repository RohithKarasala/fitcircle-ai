import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

function createSet(setNumber) {
  return {
    id: crypto.randomUUID(),
    setNumber,
    weight: "",
    reps: "",
    rir: "",
  };
}

function ExerciseCard({
  exercise,
  sets,
  previousSets,
  showRir = false,
  onSetsChange,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

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

  const addSet = () => {
    onSetsChange([...sets, createSet(sets.length + 1)]);
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
              {exercise.equipment}
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
        </div>

        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="exercise-card__body">
          <p className="exercise-description">{exercise.description}</p>

          {previousSets?.length > 0 && (
            <div className="previous-performance">
              <span>Previous</span>

              <div>
                {previousSets.map((set) => (
                  <small key={set.setNumber}>
                    {set.weight || "—"} lb × {set.reps || "—"}
                    {showRir && set.rir !== ""
                      ? ` · ${set.rir} RIR`
                      : ""}
                  </small>
                ))}
              </div>
            </div>
          )}

          <div
            className={`set-table ${
              showRir ? "" : "set-table--no-rir"
            }`}
          >
            <div className="set-table__header">
              <span>Set</span>
              <span>Weight</span>
              <span>Reps</span>
              {showRir && <span>RIR</span>}
              <span />
            </div>

            {sets.map((set) => (
              <div className="set-row" key={set.id}>
                <strong>{set.setNumber}</strong>

                <label>
                  <span className="sr-only">
                    Set {set.setNumber} weight
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="2.5"
                    inputMode="decimal"
                    value={set.weight}
                    placeholder={
                      previousSets?.[set.setNumber - 1]?.weight ?? "0"
                    }
                    onChange={(event) =>
                      updateSet(set.id, "weight", event.target.value)
                    }
                  />
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
                      previousSets?.[set.setNumber - 1]?.reps ?? "0"
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
