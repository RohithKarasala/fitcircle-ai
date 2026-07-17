import PropTypes from "prop-types";
import { Copy, Crown, ExternalLink, Users } from "lucide-react";

import Badge from "../common/Badge";
import Button from "../common/Button";
import Card from "../common/Card";

function GroupCard({ group, onOpen, onCopyInvite }) {
  const isOwner = group.role === "owner";

  function handleKeyDown(event) {
    if (
      event.target !== event.currentTarget ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();
    onOpen(group.groupId);
  }

  return (
    <Card
      className="group-card"
      role="link"
      tabIndex={0}
      aria-label={`Open ${group.name}`}
      onClick={() => onOpen(group.groupId)}
      onKeyDown={handleKeyDown}
    >
      <div className="group-card__header">
        <div>
          <div className="group-card__title-row">
            <h2 className="group-card__title">{group.name}</h2>

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
          </div>

          <div className="group-card__meta">
            <Users size={16} aria-hidden="true" />
            <span>Private workout group</span>
          </div>
        </div>
      </div>

      {isOwner && group.inviteCode && (
        <div className="group-card__invite">
          <div>
            <span className="group-card__invite-label">
              Invite code
            </span>

            <strong className="group-card__invite-code">
              {group.inviteCode}
            </strong>
          </div>

          <Button
            variant="secondary"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onCopyInvite(group.inviteCode);
            }}
          >
            <Copy size={16} aria-hidden="true" />
            Copy
          </Button>
        </div>
      )}

      <div className="group-card__actions">
        <span className="group-card__open">
          Open Group
          <ExternalLink size={16} aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}

GroupCard.propTypes = {
  group: PropTypes.shape({
    groupId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    inviteCode: PropTypes.string,
    role: PropTypes.oneOf(["owner", "member"]).isRequired,
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
  onCopyInvite: PropTypes.func.isRequired,
};

export default GroupCard;
