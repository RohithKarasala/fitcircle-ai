import { supabase } from "./supabase";

/**
 * Converts Supabase/Postgres errors into consistent JavaScript errors.
 *
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @returns {Error}
 */
function createServiceError(error, fallbackMessage) {
  if (error instanceof Error) {
    return error;
  }

  if (error && typeof error === "object") {
    const message =
      error.message ||
      error.details ||
      error.hint ||
      fallbackMessage;

    return new Error(message);
  }

  return new Error(fallbackMessage);
}

/**
 * Ensures that a required string has a usable value.
 *
 * @param {unknown} value
 * @param {string} fieldName
 * @returns {string}
 */
function requireString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function normalizeDateOnly(value, fieldName) {
  const cleanedValue = requireString(value, fieldName);

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanedValue)) {
    return cleanedValue;
  }

  const date = new Date(cleanedValue);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date.`);
  }

  return date.toISOString().slice(0, 10);
}

/**
 * Verifies that the current user has an authenticated Supabase session.
 *
 * @returns {Promise<import("@supabase/supabase-js").User>}
 */
async function requireAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw createServiceError(
      error,
      "Unable to verify your authentication."
    );
  }

  if (!user) {
    throw new Error("You must be signed in to use groups.");
  }

  return user;
}

async function ensureProfileForUser(user) {
  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "FitCircle Member";

  const avatarUrl =
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    null;

  const { data: existingProfile, error: loadError } =
    await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", user.id)
      .maybeSingle();

  if (loadError) {
    throw createServiceError(
      loadError,
      "Unable to load your profile."
    );
  }

  if (existingProfile) {
    const profileUpdate = {
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    };

    if (!existingProfile.display_name) {
      profileUpdate.display_name = displayName;
    }

    const { error } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (error) {
      throw createServiceError(
        error,
        "Unable to update your profile."
      );
    }

    return;
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    display_name: displayName,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw createServiceError(
      error,
      "Unable to create your profile."
    );
  }
}

/**
 * Creates a private workout group.
 *
 * The database function also creates the owner's membership.
 *
 * @param {string} name
 * @returns {Promise<string>} Created group ID
 */
export async function createGroup(name) {
  const user = await requireAuthenticatedUser();
  await ensureProfileForUser(user);

  const cleanedName = requireString(name, "Group name");

  const { data, error } = await supabase.rpc("create_group", {
    p_name: cleanedName,
  });

  if (error) {
    throw createServiceError(error, "Unable to create the group.");
  }

  if (!data) {
    throw new Error("The group was created, but no group ID was returned.");
  }

  return data;
}

/**
 * Joins a group using its invite code.
 *
 * The database function normalizes spaces, hyphens, and letter casing.
 *
 * @param {string} inviteCode
 * @returns {Promise<string>} Joined group ID
 */
export async function joinGroup(inviteCode) {
  const user = await requireAuthenticatedUser();
  await ensureProfileForUser(user);

  const cleanedCode = requireString(inviteCode, "Invite code");

  const { data, error } = await supabase.rpc("join_group", {
    p_invite_code: cleanedCode,
  });

  if (error) {
    throw createServiceError(error, "Unable to join the group.");
  }

  if (!data) {
    throw new Error("The group was joined, but no group ID was returned.");
  }

  return data;
}

/**
 * Loads all groups belonging to the current user.
 *
 * @returns {Promise<Array<{
 *   groupId: string,
 *   name: string,
 *   inviteCode: string,
 *   createdBy: string,
 *   createdAt: string,
 *   updatedAt: string,
 *   role: "owner" | "member",
 *   joinedAt: string,
 *   autoShareWorkouts: boolean
 * }>>}
 */
export async function getUserGroups() {
  const user = await requireAuthenticatedUser();
  await ensureProfileForUser(user);

  const { data: memberships, error: membershipsError } = await supabase
    .from("group_members")
    .select(`
      group_id,
      role,
      joined_at,
      auto_share_workouts,
      groups (
        id,
        name,
        invite_code,
        created_by,
        created_at,
        updated_at
      )
    `)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (membershipsError) {
    throw createServiceError(
      membershipsError,
      "Unable to load your groups."
    );
  }

  return (memberships ?? [])
    .filter((membership) => membership.groups)
    .map((membership) => {
      const group = Array.isArray(membership.groups)
        ? membership.groups[0]
        : membership.groups;

      return {
        groupId: group.id,
        name: group.name,
        inviteCode: group.invite_code,
        createdBy: group.created_by,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        role: membership.role,
        joinedAt: membership.joined_at,
        autoShareWorkouts: Boolean(
          membership.auto_share_workouts
        ),
      };
    });
}

/**
 * Loads one group that the authenticated user belongs to.
 *
 * @param {string} groupId
 * @returns {Promise<{
 *   id: string,
 *   name: string,
 *   inviteCode: string,
 *   createdBy: string,
 *   createdAt: string,
 *   updatedAt: string,
 *   role: "owner" | "member",
 *   joinedAt: string,
 *   autoShareWorkouts: boolean
 * }>}
 */
export async function getGroupById(groupId) {
  const user = await requireAuthenticatedUser();
  await ensureProfileForUser(user);
  const cleanedGroupId = requireString(groupId, "Group ID");

  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select(`
      role,
      joined_at,
      auto_share_workouts,
      groups (
        id,
        name,
        invite_code,
        created_by,
        created_at,
        updated_at
      )
    `)
    .eq("group_id", cleanedGroupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw createServiceError(
      membershipError,
      "Unable to load the group."
    );
  }

  if (!membership?.groups) {
    throw new Error("Group not found or you no longer have access.");
  }

  const group = Array.isArray(membership.groups)
    ? membership.groups[0]
    : membership.groups;

  return {
    id: group.id,
    name: group.name,
    inviteCode: group.invite_code,
    createdBy: group.created_by,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
    role: membership.role,
    joinedAt: membership.joined_at,
    autoShareWorkouts: Boolean(
      membership.auto_share_workouts
    ),
  };
}

export async function updateGroupAutoShare({
  groupId,
  enabled,
}) {
  await requireAuthenticatedUser();

  const cleanedGroupId = requireString(groupId, "Group ID");

  const { data, error } = await supabase.rpc(
    "update_group_auto_share",
    {
      p_group_id: cleanedGroupId,
      p_enabled: Boolean(enabled),
    }
  );

  if (error) {
    throw createServiceError(
      error,
      "Unable to update auto-share."
    );
  }

  return Boolean(data);
}

/**
 * Loads the membership records for a group.
 *
 * At this stage, this returns user IDs and membership roles.
 * Member display names will be added through a secure database RPC
 * because profile RLS currently allows users to read only their own profile.
 *
 * @param {string} groupId
 * @returns {Promise<Array<{
 *   groupId: string,
 *   userId: string,
 *   role: "owner" | "member",
 *   joinedAt: string
 * }>>}
 */
export async function getGroupMembers(groupId) {
  await requireAuthenticatedUser();

  const cleanedGroupId = requireString(groupId, "Group ID");

  const { data, error } = await supabase.rpc(
    "get_group_members_with_profiles",
    {
      p_group_id: cleanedGroupId,
    }
  );

  if (error) {
    throw createServiceError(error, "Unable to load group members.");
  }

  return (data ?? []).map((member) => ({
    groupId: member.group_id,
    userId: member.user_id,
    role: member.role,
    joinedAt: member.joined_at,
    displayName: member.display_name,
    avatarUrl: member.avatar_url,
  }));
}

export async function updateCurrentUserProfile({ displayName }) {
  const user = await requireAuthenticatedUser();
  const cleanedDisplayName = requireString(
    displayName,
    "Display name"
  );

  if (cleanedDisplayName.length > 80) {
    throw new Error("Display name cannot exceed 80 characters.");
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name: cleanedDisplayName,
        avatar_url:
          user.user_metadata?.avatar_url ??
          user.user_metadata?.picture ??
          null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

  if (error) {
    throw createServiceError(
      error,
      "Unable to update your display name."
    );
  }

  return {
    id: user.id,
    displayName: cleanedDisplayName,
  };
}

/**
 * Loads the share-safe workout feed for a group.
 *
 * The database RPC returns:
 * - Member name and avatar
 * - Shared workout date
 * - Workout name
 * - Exercise names
 * - Set numbers
 * - Weights
 * - Reps
 *
 * It excludes private session notes and RIR.
 *
 * @param {string} groupId
 * @param {{ limit?: number, offset?: number }} options
 * @returns {Promise<Array>}
 */
export async function getGroupWorkoutFeed(
  groupId,
  { limit = 30, offset = 0 } = {}
) {
  await requireAuthenticatedUser();

  const cleanedGroupId = requireString(groupId, "Group ID");

  const safeLimit = Math.min(
    Math.max(Number.parseInt(limit, 10) || 30, 1),
    100
  );

  const safeOffset = Math.max(
    Number.parseInt(offset, 10) || 0,
    0
  );

  const { data, error } = await supabase.rpc(
    "get_group_workout_feed",
    {
      p_group_id: cleanedGroupId,
      p_limit: safeLimit,
      p_offset: safeOffset,
    }
  );

  if (error) {
    throw createServiceError(
      error,
      "Unable to load the group workout feed."
    );
  }

  return (data ?? []).map((item) => ({
    shareId: item.share_id,
    workoutSessionId: item.workout_session_id,
    userId: item.user_id,
    displayName: item.display_name,
    avatarUrl: item.avatar_url,
    workoutDate: item.workout_date,
    workoutDay: item.workout_day,
    workoutName: item.workout_name,
    message: item.message,
    sharedAt: item.shared_at,
    totalSets: Number(item.total_sets ?? 0),
    exercises: Array.isArray(item.exercises)
      ? item.exercises
      : [],
  }));
}

/**
 * Shares one of the authenticated user's workout sessions with a group.
 *
 * @param {{
 *   workoutSessionId: string,
 *   groupId: string,
 *   workoutDate: string,
 *   message?: string | null
 * }} share
 * @returns {Promise<string>} Share ID
 */
export async function shareWorkoutWithGroup({
  workoutSessionId,
  groupId,
  workoutDate,
  message = null,
}) {
  await requireAuthenticatedUser();

  const cleanedSessionId = requireString(
    workoutSessionId,
    "Workout session ID"
  );

  const cleanedGroupId = requireString(groupId, "Group ID");
  const cleanedWorkoutDate = normalizeDateOnly(
    workoutDate,
    "Workout date"
  );

  const cleanedMessage =
    typeof message === "string" && message.trim()
      ? message.trim()
      : null;

  if (cleanedMessage && cleanedMessage.length > 500) {
    throw new Error("Share message cannot exceed 500 characters.");
  }

  const { data, error } = await supabase.rpc(
    "share_workout_with_group",
    {
      p_workout_session_id: cleanedSessionId,
      p_group_id: cleanedGroupId,
      p_workout_date: cleanedWorkoutDate,
      p_message: cleanedMessage,
    }
  );

  if (error) {
    throw createServiceError(
      error,
      "Unable to share the workout."
    );
  }

  if (!data) {
    throw new Error(
      "The workout was shared, but no share ID was returned."
    );
  }

  return data;
}

/**
 * Removes a workout from a group's feed.
 *
 * The original workout and its sets remain stored privately.
 *
 * @param {string} workoutSessionId
 * @param {string} groupId
 * @returns {Promise<void>}
 */
export async function unshareWorkoutFromGroup(
  workoutSessionId,
  groupId
) {
  await requireAuthenticatedUser();

  const cleanedSessionId = requireString(
    workoutSessionId,
    "Workout session ID"
  );

  const cleanedGroupId = requireString(groupId, "Group ID");

  const { error } = await supabase.rpc(
    "unshare_workout_from_group",
    {
      p_workout_session_id: cleanedSessionId,
      p_group_id: cleanedGroupId,
    }
  );

  if (error) {
    throw createServiceError(
      error,
      "Unable to remove the shared workout."
    );
  }
}

/**
 * Leaves a group.
 *
 * Group owners cannot leave. They must delete the group.
 *
 * @param {string} groupId
 * @returns {Promise<void>}
 */
export async function leaveGroup(groupId) {
  await requireAuthenticatedUser();

  const cleanedGroupId = requireString(groupId, "Group ID");

  const { error } = await supabase.rpc("leave_group", {
    p_group_id: cleanedGroupId,
  });

  if (error) {
    throw createServiceError(error, "Unable to leave the group.");
  }
}

/**
 * Removes another member from a group.
 *
 * Only the group owner may perform this action.
 *
 * @param {string} groupId
 * @param {string} memberUserId
 * @returns {Promise<void>}
 */
export async function removeGroupMember(groupId, memberUserId) {
  await requireAuthenticatedUser();

  const cleanedGroupId = requireString(groupId, "Group ID");
  const cleanedMemberId = requireString(
    memberUserId,
    "Member user ID"
  );

  const { error } = await supabase.rpc("remove_group_member", {
    p_group_id: cleanedGroupId,
    p_member_user_id: cleanedMemberId,
  });

  if (error) {
    throw createServiceError(
      error,
      "Unable to remove the group member."
    );
  }
}

/**
 * Renames a group.
 *
 * Only the group owner may perform this action.
 *
 * @param {string} groupId
 * @param {string} name
 * @returns {Promise<void>}
 */
export async function renameGroup(groupId, name) {
  await requireAuthenticatedUser();

  const cleanedGroupId = requireString(groupId, "Group ID");
  const cleanedName = requireString(name, "Group name");

  const { error } = await supabase.rpc("rename_group", {
    p_group_id: cleanedGroupId,
    p_name: cleanedName,
  });

  if (error) {
    throw createServiceError(error, "Unable to rename the group.");
  }
}

/**
 * Generates a replacement invite code.
 *
 * The previous invite code immediately stops working.
 *
 * @param {string} groupId
 * @returns {Promise<string>}
 */
export async function regenerateGroupInviteCode(groupId) {
  await requireAuthenticatedUser();

  const cleanedGroupId = requireString(groupId, "Group ID");

  const { data, error } = await supabase.rpc(
    "regenerate_group_invite_code",
    {
      p_group_id: cleanedGroupId,
    }
  );

  if (error) {
    throw createServiceError(
      error,
      "Unable to regenerate the invite code."
    );
  }

  if (!data) {
    throw new Error(
      "A new invite code was generated, but it was not returned."
    );
  }

  return data;
}

/**
 * Permanently deletes a group.
 *
 * Memberships and workout-share records are removed through cascading
 * foreign keys. Original private workouts remain untouched.
 *
 * @param {string} groupId
 * @returns {Promise<void>}
 */
export async function deleteGroup(groupId) {
  await requireAuthenticatedUser();

  const cleanedGroupId = requireString(groupId, "Group ID");

  const { error } = await supabase.rpc("delete_group", {
    p_group_id: cleanedGroupId,
  });

  if (error) {
    throw createServiceError(error, "Unable to delete the group.");
  }
}
