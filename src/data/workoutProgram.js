export const workoutProgram = {
  monday: {
    label: "Monday",
    name: "Upper Body Strength",
    focus: "Heavy, controlled upper-body compounds",
    estimatedMinutes: 65,
    exercises: [
      {
        id: "hammer-chest-press",
        name: "Hammer Strength Chest Press",
        equipment: "Machine",
        sets: 4,
        repRange: "5",
        restSeconds: 150,
        description:
          "Set the handles around mid-chest height. Keep your shoulder blades stable and press without aggressively locking your elbows.",
      },
      {
        id: "seated-cable-row",
        name: "Seated Cable Row",
        equipment: "Cable",
        sets: 3,
        repRange: "6",
        restSeconds: 120,
        description:
          "Sit tall, brace your torso and drive your elbows behind you without leaning backward for momentum.",
      },
      {
        id: "wide-grip-pulldown",
        name: "Wide-Grip Lat Pulldown",
        equipment: "Cable",
        sets: 3,
        repRange: "6",
        restSeconds: 120,
        description:
          "Pull toward your upper chest while keeping your ribs controlled. Avoid turning the movement into a row.",
      },
      {
        id: "machine-shoulder-press",
        name: "Machine Shoulder Press",
        equipment: "Machine",
        sets: 3,
        repRange: "6",
        restSeconds: 120,
        description:
          "Keep your ribs down and press through a comfortable range without shrugging.",
      },
      {
        id: "rope-pushdown",
        name: "Rope Triceps Pushdown",
        equipment: "Cable",
        sets: 3,
        repRange: "8",
        restSeconds: 75,
        description:
          "Keep your elbows beside your torso and extend fully without moving your upper arms.",
      },
      {
        id: "preacher-curl",
        name: "Preacher Curl",
        equipment: "Machine or EZ-bar",
        sets: 3,
        repRange: "8",
        restSeconds: 75,
        description:
          "Keep your upper arms supported and lower the weight under control.",
      },
    ],
  },

  tuesday: {
    label: "Tuesday",
    name: "Lower Body Strength",
    focus: "Quads, hamstrings, calves and core",
    estimatedMinutes: 70,
    exercises: [
      {
        id: "hack-squat",
        name: "Hack Squat",
        equipment: "Machine",
        sets: 4,
        repRange: "5",
        restSeconds: 180,
        description:
          "Use a stance that allows comfortable depth. Keep your heels planted and knees tracking with your toes.",
      },
      {
        id: "leg-press",
        name: "Leg Press",
        equipment: "Machine",
        sets: 4,
        repRange: "6",
        restSeconds: 150,
        description:
          "Lower under control until your pelvis is about to tuck, then press through your whole foot.",
      },
      {
        id: "romanian-deadlift",
        name: "Romanian Deadlift",
        equipment: "Dumbbells",
        sets: 3,
        repRange: "6",
        restSeconds: 150,
        description:
          "Push your hips backward with a slight knee bend and keep the dumbbells close to your legs.",
      },
      {
        id: "seated-leg-curl",
        name: "Seated Leg Curl",
        equipment: "Machine",
        sets: 3,
        repRange: "8",
        restSeconds: 90,
        description:
          "Align your knees with the machine pivot and keep your hips against the seat.",
      },
      {
        id: "standing-calf-raise",
        name: "Standing Calf Raise",
        equipment: "Machine",
        sets: 4,
        repRange: "8",
        restSeconds: 75,
        description:
          "Pause in the stretched and contracted positions instead of bouncing.",
      },
      {
        id: "hanging-knee-raise",
        name: "Hanging Knee Raise",
        equipment: "Captain's chair",
        sets: 3,
        repRange: "12",
        restSeconds: 60,
        description:
          "Curl your pelvis upward rather than only lifting your knees from the hips.",
      },
    ],
  },

  wednesday: {
    label: "Wednesday",
    name: "Push Hypertrophy",
    focus: "Chest, shoulders and triceps",
    estimatedMinutes: 65,
    exercises: [
      {
        id: "incline-chest-press",
        name: "Incline Chest Press",
        equipment: "Machine",
        sets: 4,
        repRange: "10–12",
        restSeconds: 120,
        description:
          "Use a moderate incline and keep your shoulders stable throughout the movement.",
      },
      {
        id: "pec-deck",
        name: "Pec Deck",
        equipment: "Machine",
        sets: 3,
        repRange: "12–15",
        restSeconds: 75,
        description:
          "Maintain a slight elbow bend and squeeze your chest without rolling your shoulders forward.",
      },
      {
        id: "machine-shoulder-press-hypertrophy",
        name: "Machine Shoulder Press",
        equipment: "Machine",
        sets: 3,
        repRange: "10–12",
        restSeconds: 105,
        description:
          "Keep your torso supported and stop before your shoulders lose a comfortable position.",
      },
      {
        id: "lateral-raise",
        name: "Dumbbell Lateral Raise",
        equipment: "Dumbbells",
        sets: 4,
        repRange: "12–15",
        restSeconds: 60,
        description:
          "Lead with your elbows and avoid swinging or shrugging.",
      },
      {
        id: "overhead-triceps-extension",
        name: "Rope Overhead Extension",
        equipment: "Cable",
        sets: 3,
        repRange: "12",
        restSeconds: 75,
        description:
          "Keep your upper arms mostly fixed and extend without flaring your ribs.",
      },
      {
        id: "assisted-dips",
        name: "Assisted Dips",
        equipment: "Machine",
        sets: 3,
        repRange: "12",
        restSeconds: 90,
        description:
          "Use enough assistance to maintain a controlled range and comfortable shoulder position.",
      },
    ],
  },

  thursday: {
    label: "Thursday",
    name: "Pull Hypertrophy",
    focus: "Back, rear delts and biceps",
    estimatedMinutes: 65,
    exercises: [
      {
        id: "close-grip-pulldown",
        name: "Close-Grip Pulldown",
        equipment: "Cable",
        sets: 4,
        repRange: "10",
        restSeconds: 105,
        description:
          "Drive your elbows toward your hips while keeping your torso relatively upright.",
      },
      {
        id: "chest-supported-row",
        name: "Chest-Supported Row",
        equipment: "Machine",
        sets: 4,
        repRange: "10",
        restSeconds: 105,
        description:
          "Keep your chest against the pad and pull without shrugging.",
      },
      {
        id: "reverse-pec-deck",
        name: "Reverse Pec Deck",
        equipment: "Machine",
        sets: 3,
        repRange: "15",
        restSeconds: 60,
        description:
          "Sweep your arms apart using your rear delts while keeping your chest against the pad.",
      },
      {
        id: "straight-arm-pulldown",
        name: "Straight-Arm Pulldown",
        equipment: "Cable",
        sets: 3,
        repRange: "15",
        restSeconds: 60,
        description:
          "Keep your elbows softly bent and pull from your shoulders toward your thighs.",
      },
      {
        id: "incline-dumbbell-curl",
        name: "Incline Dumbbell Curl",
        equipment: "Dumbbells",
        sets: 3,
        repRange: "12",
        restSeconds: 75,
        description:
          "Let your arms hang naturally and avoid bringing your elbows forward.",
      },
      {
        id: "rope-hammer-curl",
        name: "Rope Hammer Curl",
        equipment: "Cable",
        sets: 3,
        repRange: "12",
        restSeconds: 75,
        description:
          "Maintain a neutral grip and curl without rocking your torso.",
      },
    ],
  },

  friday: {
    label: "Friday",
    name: "Legs Hypertrophy",
    focus: "Higher-repetition lower-body training",
    estimatedMinutes: 70,
    exercises: [
      {
        id: "pendulum-squat",
        name: "Pendulum Squat or Hack Squat",
        equipment: "Machine",
        sets: 4,
        repRange: "10",
        restSeconds: 150,
        description:
          "Control the descent and use the deepest comfortable range while keeping your heels planted.",
      },
      {
        id: "bulgarian-split-squat",
        name: "Bulgarian Split Squat",
        equipment: "Dumbbells",
        sets: 3,
        repRange: "12",
        restSeconds: 120,
        description:
          "Keep your front foot planted and descend under control. Perform the target repetitions per leg.",
      },
      {
        id: "leg-extension",
        name: "Leg Extension",
        equipment: "Machine",
        sets: 3,
        repRange: "15",
        restSeconds: 75,
        description:
          "Extend smoothly and avoid swinging or slamming the weight stack.",
      },
      {
        id: "lying-leg-curl",
        name: "Lying Leg Curl",
        equipment: "Machine",
        sets: 3,
        repRange: "15",
        restSeconds: 75,
        description:
          "Keep your hips against the pad and avoid arching your lower back.",
      },
      {
        id: "seated-calf-raise",
        name: "Seated Calf Raise",
        equipment: "Machine",
        sets: 5,
        repRange: "15",
        restSeconds: 60,
        description:
          "Pause in the stretched position and rise without bouncing.",
      },
      {
        id: "cable-crunch",
        name: "Cable Crunch",
        equipment: "Cable",
        sets: 3,
        repRange: "15",
        restSeconds: 60,
        description:
          "Bring your ribs toward your pelvis while keeping your hips relatively still.",
      },
    ],
  },
};

export const workoutDays = Object.keys(workoutProgram);

export function getTodayWorkoutKey() {
  const day = new Date().getDay();

  const dayMap = {
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
  };

  return dayMap[day] ?? "monday";
}
