import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dumbbell,
  RefreshCw,
  Users,
} from "lucide-react";

import Button from "../components/common/Button";
import Card from "../components/common/Card";
import CreateGroupDialog from "../components/groups/CreateGroupDialog";
import GroupCard from "../components/groups/GroupCard";
import JoinGroupDialog from "../components/groups/JoinGroupDialog";
import { useGroups } from "../hooks/useGroups";

function Groups() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");

  const {
    data: groups = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGroups();

  function openGroup(groupId) {
    navigate(`/groups/${groupId}`);
  }

  async function copyInviteCode(inviteCode) {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setNotice("Invite code copied.");

      window.setTimeout(() => {
        setNotice("");
      }, 2500);
    } catch {
      setNotice(
        `Copy failed. Invite code: ${inviteCode}`
      );
    }
  }

  function handleGroupCreated(groupId) {
    setNotice("Group created successfully.");
    openGroup(groupId);
  }

  function handleGroupJoined(groupId) {
    setNotice("You joined the group.");
    openGroup(groupId);
  }

  return (
    <div className="groups-page">
      <header className="groups-page__header">
        <div>
          <div className="groups-page__eyebrow">
            <Users size={16} aria-hidden="true" />
            FitCircle Groups
          </div>

          <h1>Train together</h1>

          <p>
            Open your squad, check shared workouts, and
            manage invite access from one place.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => refetch()}
          loading={isFetching}
        >
          <RefreshCw size={17} aria-hidden="true" />
          Refresh
        </Button>
      </header>

      {notice && (
        <div
          className="groups-page__notice"
          role="status"
        >
          {notice}
        </div>
      )}

      <section className="groups-page__list-section groups-page__list-section--primary">
        <div className="groups-page__section-heading">
          <div>
            <h2>Your groups</h2>
            <p>
              Jump back into the groups you own or have
              joined.
            </p>
          </div>

          {!isLoading && !isError && (
            <span className="groups-page__count">
              {groups.length}{" "}
              {groups.length === 1 ? "group" : "groups"}
            </span>
          )}
        </div>

        {isLoading && (
          <div
            className="groups-page__loading"
            aria-live="polite"
          >
            <RefreshCw
              className="groups-page__spinner"
              size={22}
              aria-hidden="true"
            />
            Loading your groups...
          </div>
        )}

        {isError && (
          <Card className="groups-page__error">
            <h3>Unable to load groups</h3>

            <p>
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred."}
            </p>

            <Button onClick={() => refetch()}>
              Try Again
            </Button>
          </Card>
        )}

        {!isLoading &&
          !isError &&
          groups.length === 0 && (
            <Card className="groups-page__empty">
              <div className="groups-page__empty-icon">
                <Dumbbell size={30} aria-hidden="true" />
              </div>

              <h3>No groups yet</h3>

              <p>
                Create your first group or join one using
                an invite code.
              </p>
            </Card>
          )}

        {!isLoading &&
          !isError &&
          groups.length > 0 && (
            <div className="groups-page__grid">
              {groups.map((group) => (
                <GroupCard
                  key={group.groupId}
                  group={group}
                  onOpen={openGroup}
                  onCopyInvite={copyInviteCode}
                />
              ))}
            </div>
          )}
      </section>

      <section className="groups-page__manage-section">
        <div className="groups-page__section-heading">
          <div>
            <h2>Manage groups</h2>
            <p>
              Create a new group or join one with an invite
              code.
            </p>
          </div>
        </div>

        <div
          className="groups-page__actions"
          aria-label="Group actions"
        >
          <CreateGroupDialog
            onCreated={handleGroupCreated}
          />

          <JoinGroupDialog onJoined={handleGroupJoined} />
        </div>
      </section>
    </div>
  );
}

export default Groups;
