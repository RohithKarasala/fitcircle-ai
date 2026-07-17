import { supabase } from "./supabase";

function normalizeWeight(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const weight = Number(value);

  if (!Number.isFinite(weight)) {
    throw new Error("Enter a valid weight.");
  }

  if (weight < 40 || weight > 900) {
    throw new Error("Weight must be between 40 and 900 lb.");
  }

  return Math.round(weight * 10) / 10;
}

export async function getCurrentUserProfile(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, current_weight_lb")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load profile: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    currentWeightLb:
      data.current_weight_lb === null ||
      data.current_weight_lb === undefined
        ? null
        : Number(data.current_weight_lb),
  };
}

export async function updateCurrentWeight({
  user,
  weight,
}) {
  if (!user) {
    throw new Error("Sign in before updating your weight.");
  }

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Member";

  const avatarUrl =
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    null;

  const normalizedWeight = normalizeWeight(weight);

  const { data: existingProfile, error: loadError } =
    await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", user.id)
      .maybeSingle();

  if (loadError) {
    throw new Error(`Unable to load profile: ${loadError.message}`);
  }

  const profileRow = {
    id: user.id,
    avatar_url: avatarUrl,
    current_weight_lb: normalizedWeight,
    updated_at: new Date().toISOString(),
  };

  if (!existingProfile?.display_name) {
    profileRow.display_name = displayName;
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      profileRow,
      {
        onConflict: "id",
      },
    )
    .select("current_weight_lb")
    .single();

  if (error) {
    throw new Error(`Unable to update weight: ${error.message}`);
  }

  return data.current_weight_lb === null ||
    data.current_weight_lb === undefined
    ? null
    : Number(data.current_weight_lb);
}
