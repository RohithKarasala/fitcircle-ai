import { useState } from "react";
import PropTypes from "prop-types";
import {
  Copy,
  LogOut,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

import Button from "../common/Button";
import Card from "../common/Card";
import Input from "../common/Input";
import {
  useDeleteGroup,
  useLeaveGroup,
  useRegenerateGroupInviteCode,
  useRenameGroup,
} from "../../hooks/useGroups";

function SettingsPanel({
  group,
  isOwner,
  onNotice,
  onDeleted,
  onLeft,
  onError,
}) {
  const [nameState, setNameState] = useState({
    groupId: group.id,
    value: group.name,
  });
  const name =
    nameState.groupId === group.id
      ? nameState.value
      : group.name;

  const renameMutation = useRenameGroup();
  const regenerateInviteMutation =
    useRegenerateGroupInviteCode();
  const deleteGroupMutation = useDeleteGroup();
  const leaveGroupMutation = useLeaveGroup();

  async function handleRename(event) {
    event.preventDefault();

    if (!name.trim() || name.trim() === group.name) {
      return;
    }

    try {
      await renameMutation.mutateAsync({
        groupId: group.id,
        name: name.trim(),
      });
      onNotice("Group name updated.");
    } catch (error) {
      onError(error);
    }
  }

  async function handleCopyInviteCode() {
    if (!group.inviteCode) {
      onError(
        new Error(
          "This group does not currently have an invite code.",
        ),
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(group.inviteCode);
      onNotice("Invite code copied.");
    } catch {
      onNotice(`Copy failed. Invite code: ${group.inviteCode}`);
    }
  }

  async function handleRegenerateInviteCode() {
    if (!group.inviteCode) {
      onError(
        new Error(
          "This group does not currently have an invite code.",
        ),
      );
      return;
    }

    const confirmed = window.confirm(
      "Regenerate the invite code? The current code will stop working.",
    );

    if (!confirmed) {
      return;
    }

    try {
      const inviteCode =
        await regenerateInviteMutation.mutateAsync(group.id);
      onNotice(`New invite code generated: ${inviteCode}`);
    } catch (error) {
      onError(error);
    }
  }

  async function handleDeleteGroup() {
    const confirmed = window.confirm(
      "Delete this group permanently?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteGroupMutation.mutateAsync(group.id);
      onDeleted();
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
      await leaveGroupMutation.mutateAsync(group.id);
      onLeft();
    } catch (error) {
      onError(error);
    }
  }

  return (
    <div className="group-settings">
      <Card className="group-settings__card">
        <h2>Group name</h2>
        <p>
          Rename this group for every member. Keep it short
          and recognizable.
        </p>

        <form
          className="group-settings__form"
          onSubmit={handleRename}
        >
          <Input
            label="Name"
            value={name}
            onChange={(event) =>
              setNameState({
                groupId: group.id,
                value: event.target.value,
              })
            }
            maxLength={60}
            disabled={!isOwner}
          />

          <Button
            type="submit"
            disabled={
              !isOwner ||
              !name.trim() ||
              name.trim() === group.name
            }
            loading={renameMutation.isPending}
          >
            <Save size={16} aria-hidden="true" />
            Save name
          </Button>
        </form>
      </Card>

      {isOwner && (
        <Card className="group-settings__card">
          <h2>Invite code</h2>
          <p>
            Share this code with buddies you want in the
            group.
          </p>

          <div className="group-settings__invite">
            <strong>{group.inviteCode || "Unavailable"}</strong>

            <Button
              variant="secondary"
              size="small"
              disabled={!group.inviteCode}
              onClick={handleCopyInviteCode}
            >
              <Copy size={15} aria-hidden="true" />
              Copy
            </Button>

            <Button
              variant="secondary"
              size="small"
              disabled={!group.inviteCode}
              loading={regenerateInviteMutation.isPending}
              onClick={handleRegenerateInviteCode}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Regenerate
            </Button>
          </div>
        </Card>
      )}

      <Card className="group-settings__card group-settings__danger">
        <h2>{isOwner ? "Delete group" : "Leave group"}</h2>
        <p>
          {isOwner
            ? "Deleting a group removes memberships and shared feed entries. Original private workouts remain untouched."
            : "Leaving removes your access to this group and its shared feed."}
        </p>

        {isOwner ? (
          <Button
            variant="danger"
            loading={deleteGroupMutation.isPending}
            onClick={handleDeleteGroup}
          >
            <Trash2 size={16} aria-hidden="true" />
            Delete group
          </Button>
        ) : (
          <Button
            variant="danger"
            loading={leaveGroupMutation.isPending}
            onClick={handleLeaveGroup}
          >
            <LogOut size={16} aria-hidden="true" />
            Leave group
          </Button>
        )}
      </Card>
    </div>
  );
}

SettingsPanel.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    inviteCode: PropTypes.string,
  }).isRequired,
  isOwner: PropTypes.bool.isRequired,
  onNotice: PropTypes.func.isRequired,
  onDeleted: PropTypes.func.isRequired,
  onLeft: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default SettingsPanel;
