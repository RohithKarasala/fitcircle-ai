import {
  Check,
  LogIn,
  Save,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import { useAuth } from "../context/useAuth";
import {
  defaultWorkoutSchedule,
  normalizeWorkoutSchedule,
  weekDays,
  workoutProgram,
} from "../data/workoutProgram";
import {
  getCurrentUserProfile,
  updateProfileSettings,
} from "../services/profile";

const workoutOptions = Object.entries(workoutProgram).map(
  ([key, workout]) => ({
    key,
    label: `${workout.label}: ${workout.name}`,
  }),
);

function getAuthDisplayName(user) {
  return (
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    ""
  );
}

function Settings() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [schedule, setSchedule] = useState(
    defaultWorkoutSchedule,
  );
  const [isProfileLoading, setIsProfileLoading] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadSettings() {
      if (!user) {
        setDisplayName("");
        setSchedule(defaultWorkoutSchedule);
        return;
      }

      setIsProfileLoading(true);
      setErrorMessage("");

      try {
        const profile = await getCurrentUserProfile(user.id);

        if (!isCurrent) {
          return;
        }

        setDisplayName(
          profile?.displayName || getAuthDisplayName(user),
        );
        setSchedule(
          normalizeWorkoutSchedule(
            profile?.workoutSchedule ??
              defaultWorkoutSchedule,
          ),
        );
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(error.message);
        }
      } finally {
        if (isCurrent) {
          setIsProfileLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      isCurrent = false;
    };
  }, [user]);

  async function handleSaveSettings(event) {
    event.preventDefault();

    setIsSaving(true);
    setNotice("");
    setErrorMessage("");

    try {
      const profile = await updateProfileSettings({
        user,
        displayName,
        workoutSchedule: schedule,
      });

      setDisplayName(profile.displayName);
      setSchedule(profile.workoutSchedule);
      setNotice("Settings saved.");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignIn() {
    try {
      setErrorMessage("");
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function updateSchedule(day, workoutKey) {
    setSchedule((current) =>
      normalizeWorkoutSchedule({
        ...current,
        [day]: workoutKey,
      }),
    );
  }

  return (
    <div className="page settings-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Preferences</p>
          <h1>Settings</h1>
          <p>
            Manage your display name and weekly workout
            schedule.
          </p>
        </div>
      </section>

      {!isLoading && !user ? (
        <section className="auth-required-card">
          <div>
            <User size={22} />
          </div>

          <div>
            <strong>Sign in to edit settings</strong>
            <p>
              Your display name and schedule are saved to
              your account.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleSignIn}
          >
            <LogIn size={17} />
            Continue with Google
          </button>
        </section>
      ) : (
        <form
          className="settings-page__grid"
          onSubmit={handleSaveSettings}
        >
          <Card className="settings-page__card">
            <div className="settings-page__card-heading">
              <h2>Profile</h2>
              <p>
                This name appears in your groups and shared
                workout feeds.
              </p>
            </div>

            <Input
              label="Display name"
              value={displayName}
              maxLength={80}
              disabled={isProfileLoading}
              onChange={(event) =>
                setDisplayName(event.target.value)
              }
            />
          </Card>

          <Card className="settings-page__card">
            <div className="settings-page__card-heading">
              <h2>Workout schedule</h2>
              <p>
                Choose which workout should appear for each
                day on your dashboard.
              </p>
            </div>

            <div className="settings-page__schedule">
              {weekDays.map((day) => (
                <label
                  className="settings-page__schedule-row"
                  key={day}
                >
                  <span>{workoutProgram[day].label}</span>

                  <select
                    value={schedule[day]}
                    disabled={isProfileLoading}
                    onChange={(event) =>
                      updateSchedule(
                        day,
                        event.target.value,
                      )
                    }
                  >
                    {workoutOptions.map((option) => (
                      <option
                        key={option.key}
                        value={option.key}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </Card>

          {notice && (
            <div className="success-message">
              <Check size={18} />
              {notice}
            </div>
          )}

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          <div className="settings-page__actions">
            <Button
              type="submit"
              loading={isSaving}
              disabled={
                isProfileLoading || !displayName.trim()
              }
            >
              <Save size={17} />
              Save settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Settings;
