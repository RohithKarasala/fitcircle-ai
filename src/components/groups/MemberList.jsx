import PropTypes from "prop-types";
import { Crown, LogOut, Shield, UserMinus } from "lucide-react";

import Badge from "../common/Badge";
import Button from "../common/Button";
import Card from "../common/Card";
import {
  useLeaveGroup,
  useRemoveGroupMember,
} from "../../hooks/useGroups";
import { formatDate } from "../../utils/date";

function getMemberLabel(member, currentUserId) {
  if (member.userId === currentUserId) {
    return member.displayName
      ? `${member.displayName} (You)`
      : "You";
  }

  return (
    member.displayName ?? `Member ${member.userId.slice(0, 8)}`
  );
}

function getInitials(name = "") {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials;
}

function getMemberInitials(member, currentUserId) {
  const label = getMemberLabel(member, currentUserId)
    .replace(" (You)", "")
    .trim();

  return (
    getInitials(label) || member.userId.slice(0, 2).toUpperCase()
  );
}

function MemberList({
  groupId,
  members,
  currentUserId,
  isOwner,
  onLeft,
  onError,
}) {
  const removeMemberMutation = useRemoveGroupMember();
  const leaveGroupMutation = useLeaveGroup();

  async function handleRemoveMember(memberUserId) {
    const confirmed = window.confirm(
      "Remove this member from the group?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await removeMemberMutation.mutateAsync({
        groupId,
        memberUserId,
      });
    } catch (error) {
      onError(error);
    }
  }

  async function handleLeaveGroup() {
    const confirmed = window.confirm("Leave this group?");

    if (!confirmed) {
      return;
    }

    try {
      await leaveGroupMutation.mutateAsync(groupId);
      onLeft();
    } catch (error) {
      onError(error);
    }
  }

  if (members.length === 0) {
    return (
      <Card className="group-detail__empty">
        <h2>No members found</h2>
        <p>
          The roster will appear here once membership data is
          available.
        </p>
      </Card>
    );
  }

  return (
    <div className="member-list">
      {members.map((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const isMemberOwner = member.role === "owner";

        return (
          <Card
            className="member-list__row"
            key={member.userId}
          >
            {member.avatarUrl ? (
              <img
                className="member-list__avatar"
                src={member.avatarUrl}
                alt={`${getMemberLabel(member, currentUserId)} profile`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="member-list__avatar">
                {getMemberInitials(member, currentUserId)}
              </div>
            )}

            <div className="member-list__body">
              <strong>
                {getMemberLabel(member, currentUserId)}
              </strong>
              <span>Joined {formatDate(member.joinedAt)}</span>
            </div>

            <Badge
              variant={isMemberOwner ? "accent" : "neutral"}
            >
              {isMemberOwner ? (
                <>
                  <Crown size={13} aria-hidden="true" />
                  Owner
                </>
              ) : (
                <>
                  <Shield size={13} aria-hidden="true" />
                  Member
                </>
              )}
            </Badge>

            {isOwner && !isCurrentUser && !isMemberOwner && (
              <Button
                variant="danger"
                size="small"
                loading={
                  removeMemberMutation.isPending &&
                  removeMemberMutation.variables
                    ?.memberUserId === member.userId
                }
                onClick={() =>
                  handleRemoveMember(member.userId)
                }
              >
                <UserMinus size={15} aria-hidden="true" />
                Remove
              </Button>
            )}

            {!isOwner && isCurrentUser && (
              <Button
                variant="danger"
                size="small"
                loading={leaveGroupMutation.isPending}
                onClick={handleLeaveGroup}
              >
                <LogOut size={15} aria-hidden="true" />
                Leave
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}

MemberList.propTypes = {
  groupId: PropTypes.string.isRequired,
  members: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.string.isRequired,
      role: PropTypes.oneOf(["owner", "member"]).isRequired,
      joinedAt: PropTypes.string.isRequired,
      displayName: PropTypes.string,
      avatarUrl: PropTypes.string,
    }),
  ).isRequired,
  currentUserId: PropTypes.string,
  isOwner: PropTypes.bool.isRequired,
  onLeft: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default MemberList;
