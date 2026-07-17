import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createGroup,
  deleteGroup,
  getGroupById,
  getGroupMembers,
  getGroupWorkoutFeed,
  getUserGroups,
  joinGroup,
  leaveGroup,
  regenerateGroupInviteCode,
  removeGroupMember,
  renameGroup,
  shareWorkoutWithGroup,
  unshareWorkoutFromGroup,
  updateCurrentUserProfile,
} from "../services/groups";

export const groupQueryKeys = {
  all: ["groups"],

  lists: () => [...groupQueryKeys.all, "list"],

  list: () => [...groupQueryKeys.lists(), "current-user"],

  details: () => [...groupQueryKeys.all, "detail"],

  detail: (groupId) => [
    ...groupQueryKeys.details(),
    groupId,
  ],

  members: (groupId) => [
    ...groupQueryKeys.detail(groupId),
    "members",
  ],

  feeds: () => [...groupQueryKeys.all, "feed"],

  feed: (groupId, options = {}) => [
    ...groupQueryKeys.feeds(),
    groupId,
    options,
  ],
};

export function useGroups(options = {}) {
  return useQuery({
    queryKey: groupQueryKeys.list(),
    queryFn: getUserGroups,
    ...options,
  });
}

export function useGroup(groupId) {
  return useQuery({
    queryKey: groupQueryKeys.detail(groupId),
    queryFn: () => getGroupById(groupId),
    enabled: Boolean(groupId),
  });
}

export function useGroupMembers(groupId) {
  return useQuery({
    queryKey: groupQueryKeys.members(groupId),
    queryFn: () => getGroupMembers(groupId),
    enabled: Boolean(groupId),
  });
}

export function useGroupWorkoutFeed(
  groupId,
  options = {}
) {
  return useQuery({
    queryKey: groupQueryKeys.feed(groupId, options),
    queryFn: () => getGroupWorkoutFeed(groupId, options),
    enabled: Boolean(groupId),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.list(),
      });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinGroup,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.list(),
      });
    },
  });
}

export function useRenameGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, name }) =>
      renameGroup(groupId, name),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.list(),
      });

      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.detail(
          variables.groupId
        ),
      });
    },
  });
}

export function useRegenerateGroupInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: regenerateGroupInviteCode,

    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.list(),
      });

      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.detail(groupId),
      });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveGroup,

    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.list(),
      });

      queryClient.removeQueries({
        queryKey: groupQueryKeys.detail(groupId),
      });

      queryClient.removeQueries({
        queryKey: groupQueryKeys.members(groupId),
      });

      queryClient.removeQueries({
        queryKey: [
          ...groupQueryKeys.feeds(),
          groupId,
        ],
      });
    },
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, memberUserId }) =>
      removeGroupMember(groupId, memberUserId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.detail(
          variables.groupId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.members(
          variables.groupId
        ),
      });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,

    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.list(),
      });

      queryClient.removeQueries({
        queryKey: groupQueryKeys.detail(groupId),
      });

      queryClient.removeQueries({
        queryKey: groupQueryKeys.members(groupId),
      });

      queryClient.removeQueries({
        queryKey: [
          ...groupQueryKeys.feeds(),
          groupId,
        ],
      });

    },
  });
}

export function useUpdateCurrentUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCurrentUserProfile,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupQueryKeys.all,
      });
    },
  });
}

export function useShareWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shareWorkoutWithGroup,

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...groupQueryKeys.feeds(),
          variables.groupId,
        ],
      });
    },
  });
}

export function useUnshareWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workoutSessionId, groupId }) =>
      unshareWorkoutFromGroup(
        workoutSessionId,
        groupId
      ),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...groupQueryKeys.feeds(),
          variables.groupId,
        ],
      });
    },
  });
}
