import { useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown, Plus } from "lucide-react";

import Button from "../common/Button";
import Card from "../common/Card";
import Input from "../common/Input";
import { useCreateGroup } from "../../hooks/useGroups";

function CreateGroupDialog({ onCreated }) {
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const createGroupMutation = useCreateGroup();

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const cleanedName = name.trim();

    if (cleanedName.length < 2) {
      setFormError(
        "Group name must contain at least 2 characters."
      );
      setIsExpanded(true);
      return;
    }

    try {
      const groupId =
        await createGroupMutation.mutateAsync(cleanedName);

      setName("");
      setIsExpanded(false);

      if (onCreated) {
        onCreated(groupId);
      }
    } catch (error) {
      setIsExpanded(true);
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create the group."
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
          <Plus size={22} aria-hidden="true" />
        </span>

        <span className="group-action-card__content">
          <h2>Create a group</h2>
          <p>
            Start a private group and invite your workout
            partners.
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
            label="Group name"
            placeholder="Weekend Warriors"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            error={formError}
            maxLength={60}
            autoComplete="off"
          />

          <Button
            type="submit"
            loading={createGroupMutation.isPending}
            disabled={!name.trim()}
          >
            Create Group
          </Button>
        </form>
      )}
    </Card>
  );
}

CreateGroupDialog.propTypes = {
  onCreated: PropTypes.func,
};

export default CreateGroupDialog;
