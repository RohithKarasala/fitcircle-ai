import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import ExerciseGuideTabs from "./ExerciseGuideTabs";

function getGuideSubtitle(guide) {
  const seenMuscles = new Set();

  return [
    ...guide.primaryMuscles,
    ...guide.secondaryMuscles,
  ]
    .filter((muscle) => {
      const normalizedMuscle = muscle?.trim().toLowerCase();

      if (
        !normalizedMuscle ||
        seenMuscles.has(normalizedMuscle)
      ) {
        return false;
      }

      seenMuscles.add(normalizedMuscle);
      return true;
    })
    .slice(0, 3)
    .join(", ");
}

function ExerciseGuide({ guide }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("technique");

  if (!guide) {
    return null;
  }

  const guideSubtitle = getGuideSubtitle(guide);

  return (
    <section className="exercise-guide">
      <button
        type="button"
        className="exercise-guide__toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>
          <strong>Guide</strong>
          <small>{guideSubtitle}</small>
        </span>

        {isOpen ? (
          <ChevronUp size={18} />
        ) : (
          <ChevronDown size={18} />
        )}
      </button>

      {isOpen && (
        <div className="exercise-guide__content">
          <div className="exercise-guide__heading">
            <h3>{guide.name}</h3>
            <p>
              Exercise guides are educational and do not
              replace advice from a qualified medical or
              fitness professional.
            </p>
          </div>

          <ExerciseGuideTabs
            guide={guide}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      )}
    </section>
  );
}

export default ExerciseGuide;
