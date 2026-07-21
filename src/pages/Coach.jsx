import { BarChart3, Brain, MessageCircle, Sparkles } from "lucide-react";

function Coach() {
  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Personal guidance</p>
          <h1>AI Coach</h1>
          <p>Get recommendations based on training and recovery data.</p>
        </div>
      </section>

      <section className="coach-coming-soon">
        <div className="coach-coming-soon__icon">
          <Sparkles size={28} />
        </div>

        <div>
          <p className="eyebrow">Coming soon</p>
          <h2>Your training assistant is warming up</h2>
          <p>
            AI Coach will help review your workouts, spot progress trends, and
            suggest smart next steps once we connect it safely.
          </p>
        </div>
      </section>

      <section className="coach-preview-grid" aria-label="Planned AI Coach features">
        <article className="card coach-preview-card">
          <div className="card__icon">
            <Brain size={22} />
          </div>
          <h3>Workout guidance</h3>
          <p>
            Ask whether to increase weight, hold steady, deload, or adjust your
            plan based on recent sessions.
          </p>
        </article>

        <article className="card coach-preview-card">
          <div className="card__icon">
            <BarChart3 size={22} />
          </div>
          <h3>Progress analysis</h3>
          <p>
            Summarize weekly volume, PRs, consistency, and recovery signals from
            your logged data.
          </p>
        </article>

        <article className="card coach-preview-card">
          <div className="card__icon">
            <MessageCircle size={22} />
          </div>
          <h3>Personal Q&A</h3>
          <p>
            Chat through training decisions with context from your schedule,
            workouts, nutrition, and goals.
          </p>
        </article>
      </section>
    </div>
  );
}

export default Coach;
