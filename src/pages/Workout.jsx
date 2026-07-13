function Workout() {
  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Training</p>
          <h1>Workout</h1>
          <p>Your daily workout logger will live here.</p>
        </div>
      </section>

      <article className="card empty-state">
        <h2>Workout logger coming next</h2>
        <p>
          This page will show today’s exercises, previous performance, weight,
          repetitions, sets, and RIR.
        </p>
      </article>
    </div>
  );
}

export default Workout;
