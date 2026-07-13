import {
  ArrowRight,
  CalendarDays,
  Dumbbell,
  Flame,
  Scale,
} from "lucide-react";
import { Link } from "react-router-dom";

function Dashboard() {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{today}</p>
          <h1>Good morning, Rohith.</h1>
          <p>Here is what you have planned for today.</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="card card--workout">
          <div className="card__header">
            <div>
              <span className="card__label">Today’s workout</span>
              <h2>Upper Body Strength</h2>
            </div>

            <div className="card__icon">
              <Dumbbell size={22} />
            </div>
          </div>

          <div className="workout-summary">
            <div>
              <span>Exercises</span>
              <strong>6</strong>
            </div>

            <div>
              <span>Estimated time</span>
              <strong>65 min</strong>
            </div>

            <div>
              <span>Target effort</span>
              <strong>1–2 RIR</strong>
            </div>
          </div>

          <Link className="primary-button" to="/workout">
            Start workout
            <ArrowRight size={18} />
          </Link>
        </article>

        <article className="card stat-card">
          <div className="stat-card__icon">
            <Scale size={20} />
          </div>

          <span>Current weight</span>
          <strong>159.0 lb</strong>
          <small>Update your latest measurement</small>
        </article>

        <article className="card stat-card">
          <div className="stat-card__icon">
            <Flame size={20} />
          </div>

          <span>Workout streak</span>
          <strong>5 days</strong>
          <small>Keep building consistency</small>
        </article>

        <article className="card stat-card">
          <div className="stat-card__icon">
            <CalendarDays size={20} />
          </div>

          <span>This week</span>
          <strong>3 of 5</strong>
          <small>Two sessions remaining</small>
        </article>

        <article className="card card--wide">
          <div className="card__header">
            <div>
              <span className="card__label">AI recommendation</span>
              <h2>Keep today’s working weights steady</h2>
            </div>
          </div>

          <p className="recommendation-copy">
            Complete the prescribed repetitions with controlled technique.
            Increase weight only after reaching the top of the rep range with
            one or two repetitions still in reserve.
          </p>

          <Link className="text-link" to="/coach">
            Open AI Coach
            <ArrowRight size={16} />
          </Link>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
