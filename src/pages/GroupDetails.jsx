import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Crown,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";

import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import GroupFeed from "../components/groups/GroupFeed";
import MemberList from "../components/groups/MemberList";
import SettingsPanel from "../components/groups/SettingsPanel";
import { useAuth } from "../context/useAuth";
import {
  useGroup,
  useGroupMembers,
} from "../hooks/useGroups";
import { formatDate } from "../utils/date";

const tabs = [
  { id: "feed", label: "Feed" },
  { id: "members", label: "Members" },
  { id: "settings", label: "Settings" },
];

function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("feed");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const groupQuery = useGroup(groupId);
  const membersQuery = useGroupMembers(groupId);

  const group = groupQuery.data;
  const members = useMemo(
    () => membersQuery.data ?? [],
    [membersQuery.data],
  );
  const isOwner = group?.role === "owner";

  function showNotice(message) {
    setErrorMessage("");
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 3000);
  }

  function showError(error) {
    setNotice("");
    setErrorMessage(
      getErrorMessage(error, "Something went wrong."),
    );
  }

  async function copyInviteCode() {
    if (!group?.inviteCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(group.inviteCode);
      showNotice("Invite code copied.");
    } catch {
      showNotice(`Copy failed. Invite code: ${group.inviteCode}`);
    }
  }

  if (groupQuery.isLoading) {
    return (
      <div className="group-detail-page">
        <div className="group-detail__loading">
          <RefreshCw
            className="groups-page__spinner"
            size={22}
            aria-hidden="true"
          />
          Loading group...
        </div>
      </div>
    );
  }

  if (groupQuery.isError || !group) {
    return (
      <div className="group-detail-page">
        <Card className="group-detail__empty">
          <h1>Group unavailable</h1>
          <p>
            {getErrorMessage(
              groupQuery.error,
              "The group could not be loaded.",
            )}
          </p>
          <Button onClick={() => navigate("/groups")}>
            Back to groups
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="group-detail-page">
      <header className="group-detail__header">
        <Link className="text-link" to="/groups">
          <ArrowLeft size={16} aria-hidden="true" />
          Groups
        </Link>

        <div className="group-detail__heading">
          <div>
            <div className="groups-page__eyebrow">
              <Users size={16} aria-hidden="true" />
              Group details
            </div>

            <h1>{group.name}</h1>

            <div className="group-detail__meta">
              <Badge variant={isOwner ? "accent" : "neutral"}>
                {isOwner ? (
                  <>
                    <Crown size={13} aria-hidden="true" />
                    Owner
                  </>
                ) : (
                  "Member"
                )}
              </Badge>

              <span>
                {members.length}{" "}
                {members.length === 1 ? "member" : "members"}
              </span>

              <span>Joined {formatDate(group.joinedAt)}</span>
            </div>
          </div>

          {isOwner && group.inviteCode && (
            <div className="group-detail__invite">
              <span>Invite code</span>
              <strong>{group.inviteCode}</strong>
              <Button
                variant="secondary"
                size="small"
                onClick={copyInviteCode}
              >
                <Copy size={15} aria-hidden="true" />
                Copy
              </Button>
            </div>
          )}
        </div>
      </header>

      {notice && (
        <div className="groups-page__notice" role="status">
          {notice}
        </div>
      )}

      {errorMessage && (
        <div className="error-message" role="alert">
          {errorMessage}
        </div>
      )}

      <nav
        className="group-detail__tabs"
        aria-label="Group sections"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={
              activeTab === tab.id
                ? "group-detail__tab group-detail__tab--active"
                : "group-detail__tab"
            }
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.id === "settings" && (
              <Settings size={15} aria-hidden="true" />
            )}
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "feed" && (
        <GroupFeed groupId={group.id} />
      )}

      {activeTab === "members" && (
        <>
          {membersQuery.isLoading ? (
            <div className="group-detail__loading">
              <RefreshCw
                className="groups-page__spinner"
                size={22}
                aria-hidden="true"
              />
              Loading members...
            </div>
          ) : membersQuery.isError ? (
            <Card className="group-detail__empty">
              <h2>Unable to load members</h2>
              <p>
                {getErrorMessage(
                  membersQuery.error,
                  "The roster could not be loaded.",
                )}
              </p>
              <Button onClick={() => membersQuery.refetch()}>
                Try Again
              </Button>
            </Card>
          ) : (
            <MemberList
              groupId={group.id}
              members={members}
              currentUserId={user?.id}
              isOwner={isOwner}
              onLeft={() => navigate("/groups")}
              onError={showError}
            />
          )}
        </>
      )}

      {activeTab === "settings" && (
        <SettingsPanel
          group={group}
          isOwner={isOwner}
          onNotice={showNotice}
          onDeleted={() => navigate("/groups")}
          onLeft={() => navigate("/groups")}
          onError={showError}
        />
      )}
    </div>
  );
}

export default GroupDetails;
