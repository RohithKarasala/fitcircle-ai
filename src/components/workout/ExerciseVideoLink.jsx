import { ExternalLink } from "lucide-react";

function ExerciseVideoLink({ videoUrl }) {
  if (!videoUrl) {
    return (
      <div className="exercise-guide__empty">
        Video guide upcoming. We will add the best demo once
        the video library is ready.
      </div>
    );
  }

  return (
    <a
      className="exercise-guide__video-link"
      href={videoUrl}
      target="_blank"
      rel="noreferrer"
    >
      <ExternalLink size={16} />
      Open exercise video
    </a>
  );
}

export default ExerciseVideoLink;
