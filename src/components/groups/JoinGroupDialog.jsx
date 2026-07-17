import { useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown, LogIn } from "lucide-react";

import Button from "../common/Button";
import Card from "../common/Card";
import Input from "../common/Input";
import { useJoinGroup } from "../../hooks/useGroups";

function JoinGroupDialog({ onJoined }) {
  const [inviteCode, setInviteCode] = useState("");
  const [formError, setFormError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const joinGroupMutation = useJoinGroup();

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const cleanedCode = inviteCode.trim();

    if (!cleanedCode) {
      setFormError("Invite code is required.");
      setIsExpanded(true);
      return;
    }

    try {
      const groupId =
        await joinGroupMutation.mutateAsync(cleanedCode);

      setInviteCode("");
      setIsExpanded(false);

      if (onJoined) {
        onJoined(groupId);
      }
    } catch (error) {
      setIsExpanded(true);
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to join the group."
      );
    }
  }

  return (
    <Card className="group-action-card">
      <button
        type="button"
        className="group-action-card__summary"
        aria-expanded={isExpanded}
        onClick={() =>
          setIsExpanded((current) => !current)
        }
      >
        <span className="group-action-card__icon">
          <LogIn size={22} aria-hidden="true" />
        </span>

        <span className="group-action-card__content">
          <h2>Join a group</h2>
          <p>
            Enter an invite code shared by one of your
            friends.
          </p>
        </span>

        <ChevronDown
          className="group-action-card__chevron"
          size={18}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <form
          className="group-action-card__form"
          onSubmit={handleSubmit}
        >
          <Input
            label="Invite code"
            placeholder="K7NP4XQM92TR"
            value={inviteCode}
            onChange={(event) =>
              setInviteCode(
                event.target.value.toUpperCase(),
              )
            }
            error={formError}
            maxLength={30}
            autoCapitalize="characters"
            autoComplete="off"
          />

          <Button
            type="submit"
            variant="secondary"
            loading={joinGroupMutation.isPending}
            disabled={!inviteCode.trim()}
          >
            Join Group
          </Button>
        </form>
      )}
    </Card>
  );
}

JoinGroupDialog.propTypes = {
  onJoined: PropTypes.func,
};

export default JoinGroupDialog;
