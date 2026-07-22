import PropTypes from "prop-types";
import {
  CalendarDays,
  Dumbbell,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import Badge from "../common/Badge";
import Button from "../common/Button";
import Card from "../common/Card";
import { useGroupWorkoutFeed } from "../../hooks/useGroups";
import { formatDate } from "../../utils/date";
import {
  formatSetPerformance,
  getSessionExternalVolume,
} from "../../utils/workoutMetrics";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function GroupFeed({ groupId }) {
  const {
    data: feedItems = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGroupWorkoutFeed(groupId);

  if (isLoading) {
    return (
      <div className="group-detail__loading">
        <RefreshCw
          className="groups-page__spinner"
          size={22}
          aria-hidden="true"
        />
        Loading group feed...
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="group-detail__empty">
        <h2>Unable to load feed</h2>
        <p>
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred."}
        </p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </Card>
    );
  }

  if (feedItems.length === 0) {
    return (
      <Card className="group-detail__empty">
        <div className="group-detail__empty-icon">
          <Dumbbell size={28} aria-hidden="true" />
        </div>
        <h2>No shared workouts yet</h2>
        <p>
          Shared sessions will appear here once members start
          posting workouts to this group.
        </p>
      </Card>
    );
  }

  return (
    <div className="group-feed">
      <div className="group-feed__toolbar">
        <span>
          {feedItems.length} shared{" "}
          {feedItems.length === 1 ? "workout" : "workouts"}
        </span>

        <Button
          variant="secondary"
          size="small"
          loading={isFetching}
          onClick={() => refetch()}
        >
          <RefreshCw size={15} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {feedItems.map((item) => {
        const displayName =
          item.displayName || "FitCircle Member";
        const exercises = item.exercises ?? [];
        const volume = getSessionExternalVolume(exercises);
        const initials = getInitials(displayName);

        return (
          <Card
            className="group-feed-card"
            key={item.shareId}
          >
            <div className="group-feed-card__header">
              {item.avatarUrl ? (
                <img
                  className="group-feed-card__avatar"
                  src={item.avatarUrl}
                  alt={`${displayName} profile`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="group-feed-card__avatar">
                  {initials || "FC"}
                </div>
              )}

              <div>
                <strong>{displayName}</strong>
                <span>
                  <CalendarDays size={14} aria-hidden="true" />
                  {formatDate(item.workoutDate)}
                </span>
              </div>
            </div>

            <div className="group-feed-card__summary">
              <div>
                <h2>{item.workoutName}</h2>
                {item.message && <p>{item.message}</p>}
              </div>

              <div className="group-feed-card__metrics">
                <Badge variant="accent">
                  <Dumbbell size={13} aria-hidden="true" />
                  {item.totalSets} sets
                </Badge>

                <Badge variant="neutral">
                  <TrendingUp size={13} aria-hidden="true" />
                  {volume.toLocaleString()} lb external volume
                </Badge>
              </div>
            </div>

            <div className="group-feed-card__exercises">
              {exercises.map((exercise) => (
                <div key={exercise.exerciseId}>
                  <strong>{exercise.exerciseName}</strong>
                  <span>
                    {(exercise.sets ?? [])
                      .map(
                        (set) =>
                          formatSetPerformance(set),
                      )
                      .join(" | ")}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

GroupFeed.propTypes = {
  groupId: PropTypes.string.isRequired,
};

export default GroupFeed;
