import ExerciseVideoLink from "./ExerciseVideoLink";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "technique", label: "Technique" },
  { id: "mistakes", label: "Mistakes" },
  { id: "video", label: "Video" },
];

function ListBlock({ title, items, ordered = false }) {
  if (!items?.length) {
    return null;
  }

  const Component = ordered ? "ol" : "ul";

  return (
    <div className="exercise-guide__block">
      <h4>{title}</h4>
      <Component>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </Component>
    </div>
  );
}

function ExerciseGuideTabs({
  guide,
  activeTab,
  onTabChange,
}) {
  return (
    <div className="exercise-guide__tabs">
      <div
        className="exercise-guide__tab-list"
        role="tablist"
        aria-label={`${guide.name} guide sections`}
      >
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={
              activeTab === tab.id
                ? "exercise-guide__tab exercise-guide__tab--active"
                : "exercise-guide__tab"
            }
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="exercise-guide__panel">
        {activeTab === "overview" && (
          <>
            <p>{guide.overview}</p>
            <ListBlock
              title="Primary"
              items={guide.primaryMuscles}
            />
            <ListBlock
              title="Secondary"
              items={guide.secondaryMuscles}
            />
          </>
        )}

        {activeTab === "technique" && (
          <>
            <ListBlock
              title="How to perform"
              items={guide.steps}
              ordered
            />
            <ListBlock title="Pro tip" items={guide.tips} />
          </>
        )}

        {activeTab === "mistakes" && (
          <>
            <ListBlock
              title="Common mistakes"
              items={guide.mistakes}
            />
            <ListBlock
              title="You should feel"
              items={guide.feel}
            />
            <ListBlock
              title="Stop or adjust if you feel"
              items={guide.avoidFeeling}
            />
          </>
        )}

        {activeTab === "video" && (
          <ExerciseVideoLink videoUrl={guide.videoUrl} />
        )}
      </div>
    </div>
  );
}

export default ExerciseGuideTabs;
