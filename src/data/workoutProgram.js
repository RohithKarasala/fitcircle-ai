export const workoutProgram = {
  monday: {
    label: "Monday",
    name: "Chest, Triceps & Shoulders",
    focus: "Primary push day with balanced chest, triceps, and shoulder work",
    estimatedMinutes: 70,
    exercises: [
      {
        id: "machine-chest-press-monday",
        name: "Machine Chest Press",
        equipment: "Machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Set the handles around mid-chest height. Keep your shoulder blades stable and press without aggressively locking your elbows.",
      },
      {
        id: "incline-machine-press",
        name: "Incline Machine Press",
        equipment: "Machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Use a moderate incline and keep your shoulders supported. Lower under control and press without shrugging.",
      },
      {
        id: "pec-deck-monday",
        name: "Pec Deck",
        equipment: "Machine",
        sets: 3,
        repRange: "12–15",
        restSeconds: 60,
        description:
          "Keep a slight bend in your elbows and bring your arms together by squeezing your chest.",
      },
      {
        id: "rope-pushdown-monday",
        name: "Rope Pushdown",
        equipment: "Cable",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Keep your elbows close to your torso and extend fully without moving your upper arms.",
      },
      {
        id: "reverse-pushdown",
        name: "Reverse Pushdown",
        equipment: "Cable",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Use an underhand grip, keep your elbows fixed, and extend the cable without leaning forward.",
      },
      {
        id: "machine-shoulder-press-monday",
        name: "Machine Shoulder Press",
        equipment: "Machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Keep your ribs controlled and press through a comfortable range without shrugging.",
      },
      {
        id: "lateral-raise-monday",
        name: "Lateral Raise",
        equipment: "Dumbbells or machine",
        sets: 3,
        repRange: "12–15",
        restSeconds: 60,
        description:
          "Lead with your elbows and raise to roughly shoulder height without swinging.",
      },
      {
        id: "reverse-pec-deck-monday",
        name: "Reverse Pec Deck",
        equipment: "Machine",
        sets: 3,
        repRange: "12–15",
        restSeconds: 60,
        description:
          "Keep your chest against the pad and sweep your arms apart using your rear delts.",
      },
    ],
  },

  tuesday: {
    label: "Tuesday",
    name: "Back & Biceps",
    focus: "Vertical pulling, horizontal pulling, lower back, and biceps",
    estimatedMinutes: 65,
    exercises: [
      {
        id: "lat-pulldown-tuesday",
        name: "Lat Pulldown",
        equipment: "Cable",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Pull toward your upper chest while keeping your torso controlled and your shoulders down.",
      },
      {
        id: "wide-grip-pulldown-tuesday",
        name: "Pull-Ups",
        equipment: "Bodyweight or assisted pull-up machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Use a controlled range, keep your shoulders down, and choose bodyweight or assisted resistance as needed.",
      },
      {
        id: "row-machine-tuesday",
        name: "Row Machine",
        equipment: "Machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Keep your chest stable and drive your elbows backward without shrugging.",
      },
      {
        id: "back-extension",
        name: "Back Extension",
        equipment: "Back extension bench or machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 75,
        description:
          "Move through the hips, keep your spine neutral, and stop when your torso is aligned with your legs.",
      },
      {
        id: "preacher-curl-tuesday",
        name: "Preacher Curl",
        equipment: "Machine or EZ-bar",
        sets: 3,
        repRange: "8–12",
        restSeconds: 60,
        description:
          "Keep your upper arms supported and lower the weight under control.",
      },
      {
        id: "hammer-curl-tuesday",
        name: "Hammer Curl",
        equipment: "Dumbbells or cable",
        sets: 3,
        repRange: "10–12",
        restSeconds: 60,
        description:
          "Maintain a neutral grip and curl without swinging your torso.",
      },
    ],
  },

  wednesday: {
    label: "Wednesday",
    name: "Legs",
    focus: "Complete lower-body session with quads, hamstrings, glutes, and calves",
    estimatedMinutes: 75,
    exercises: [
      {
        id: "squat-wednesday",
        name: "Squat",
        equipment: "Barbell, Smith machine, or squat machine",
        sets: 3,
        repRange: "6–10",
        restSeconds: 150,
        description:
          "Brace your torso, keep your feet planted, and descend through the deepest comfortable range.",
      },
      {
        id: "leg-extension-wednesday",
        name: "Leg Extension",
        equipment: "Machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Align your knees with the machine pivot and extend smoothly without swinging.",
      },
      {
        id: "seated-leg-curl-wednesday",
        name: "Seated Leg Curl",
        equipment: "Machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Keep your hips against the seat and curl through a controlled range.",
      },
      {
        id: "hip-abductor",
        name: "Hip Abductor",
        equipment: "Machine",
        sets: 3,
        repRange: "12–20",
        restSeconds: 60,
        description:
          "Keep your torso stable and open your knees under control without bouncing.",
      },
      {
        id: "hip-adductor",
        name: "Hip Adductor",
        equipment: "Machine",
        sets: 3,
        repRange: "12–20",
        restSeconds: 60,
        description:
          "Bring your legs together smoothly and control the return.",
      },
      {
        id: "standing-calf-raise-wednesday",
        name: "Standing Calf Raise",
        equipment: "Machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Use a full stretch, rise as high as possible, and avoid bouncing.",
      },
      {
        id: "glute-machine",
        name: "Glute Machine",
        equipment: "Machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 75,
        description:
          "Keep your torso stable and drive through the hip without arching your lower back.",
      },
      {
        id: "abdominal-crunch",
        name: "Abdominal",
        equipment: "Machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Bring your ribs toward your pelvis using your abdominal muscles rather than pulling only with your arms.",
      },
    ],
  },

  thursday: {
    label: "Thursday",
    name: "Shoulders, Chest, Triceps & Forearms",
    focus: "Secondary push day with shoulder emphasis and forearm work",
    estimatedMinutes: 70,
    exercises: [
      {
        id: "dumbbell-shoulder-press-thursday",
        name: "Dumbbell Shoulder Press",
        equipment: "Dumbbells",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Press the dumbbells overhead with control, keeping your ribs down and avoiding a hard shrug at the top.",
      },
      {
        id: "lateral-raise-thursday",
        name: "Lateral Raise",
        equipment: "Dumbbells or machine",
        sets: 3,
        repRange: "12–15",
        restSeconds: 60,
        description:
          "Raise with control and avoid using momentum.",
      },
      {
        id: "reverse-pec-deck-thursday",
        name: "Reverse Pec Deck",
        equipment: "Machine",
        sets: 3,
        repRange: "12–15",
        restSeconds: 60,
        description:
          "Keep your chest against the pad and focus on your rear delts rather than your traps.",
      },
      {
        id: "shrugs-thursday",
        name: "Shrugs",
        equipment: "Dumbbells or machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 75,
        description:
          "Raise your shoulders straight upward, pause briefly, and lower under control.",
      },
      {
        id: "chest-press-thursday",
        name: "Chest Press",
        equipment: "Dumbbells, barbell, smith machine, or machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Press through a controlled range with stable shoulders, using the setup that feels best for today.",
      },
      {
        id: "triceps-pushdown-thursday",
        name: "Triceps Pushdown",
        equipment: "Cable, rope, or machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Keep your elbows fixed and fully extend without leaning your whole body into the movement.",
      },
      {
        id: "wrist-curl",
        name: "Wrist Curl",
        equipment: "Dumbbells, barbell, or cable",
        sets: 3,
        repRange: "12–20",
        restSeconds: 45,
        description:
          "Support your forearms and move only through the wrists using a controlled range.",
      },
      {
        id: "reverse-wrist-curl",
        name: "Reverse Wrist Curl",
        equipment: "Dumbbells, barbell, or cable",
        sets: 3,
        repRange: "12–20",
        restSeconds: 45,
        description:
          "Keep your forearms supported and extend your wrists without using momentum.",
      },
    ],
  },

  friday: {
    label: "Friday",
    name: "Legs, Back, Biceps & Core",
    focus: "Secondary lower and pull session with direct core work",
    estimatedMinutes: 70,
    exercises: [
      {
        id: "leg-press-friday",
        name: "Leg Press",
        equipment: "Machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 120,
        description:
          "Lower under control and press through your full foot without aggressively locking your knees.",
      },
      {
        id: "lat-pulldown-friday",
        name: "Pull-Ups",
        equipment: "Bodyweight or assisted pull-up machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Drive your elbows downward while keeping your torso controlled. Use assistance if needed.",
      },
      {
        id: "row-machine-friday",
        name: "Row Machine",
        equipment: "Machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Keep your chest stable and pull your elbows backward without shrugging.",
      },
      {
        id: "preacher-curl-friday",
        name: "Preacher Curl",
        equipment: "Machine or EZ-bar",
        sets: 3,
        repRange: "8–12",
        restSeconds: 60,
        description:
          "Keep your upper arms supported and control the lowering phase.",
      },
      {
        id: "hammer-curl-friday",
        name: "Hammer Curl",
        equipment: "Dumbbells or cable",
        sets: 3,
        repRange: "10–12",
        restSeconds: 60,
        description:
          "Maintain a neutral grip and avoid swinging your torso.",
      },
      {
        id: "torso-crunch-machine",
        name: "Torso Rotation",
        equipment: "Machine",
        sets: 3,
        repRange: "12–15",
        restSeconds: 60,
        description:
          "Rotate through a controlled range with your hips anchored and your ribs stacked over your pelvis.",
      },
      {
        id: "hanging-leg-raise",
        name: "Hanging Leg Raise",
        equipment: "Pull-up bar or captain's chair",
        sets: 3,
        repRange: "8–15",
        restSeconds: 60,
        description:
          "Control the movement and curl your pelvis upward instead of only swinging your legs.",
      },
    ],
  },

  recovery: {
    label: "Recovery",
    name: "Recovery Walk",
    focus: "Easy movement, steps, sunlight, and recovery",
    estimatedMinutes: 35,
    exercises: [
      {
        id: "recovery-walk",
        name: "Outdoor Walk",
        equipment: "Bodyweight",
        trackingType: "completion",
        sets: 1,
        repRange: "30–45 min",
        restSeconds: 0,
        description:
          "Keep the pace easy enough to hold a conversation. Get outside if you can and let this support recovery rather than feel like another hard session.",
      },
    ],
  },

  fullBodyA: {
    label: "Full Body A",
    name: "Full Body A",
    focus: "Starter full-body session with squat, press, row, and core work",
    estimatedMinutes: 55,
    exercises: [
      {
        id: "squat-wednesday",
        name: "Squat",
        equipment: "Barbell, Smith machine, or squat machine",
        sets: 3,
        repRange: "6–10",
        restSeconds: 150,
        description:
          "Brace your torso, keep your feet planted, and descend through the deepest comfortable range.",
      },
      {
        id: "chest-press-thursday",
        name: "Chest Press",
        equipment: "Dumbbells, barbell, smith machine, or machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Press through a controlled range with stable shoulders, using the setup that feels best for today.",
      },
      {
        id: "row-machine-tuesday",
        name: "Row Machine",
        equipment: "Machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Keep your chest stable and drive your elbows backward without shrugging.",
      },
      {
        id: "abdominal-crunch",
        name: "Abdominal",
        equipment: "Machine, cable, or bodyweight",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Bring your ribs toward your pelvis under control without yanking with your neck or arms.",
      },
    ],
  },

  fullBodyB: {
    label: "Full Body B",
    name: "Full Body B",
    focus: "Starter full-body session with hinge, pull, shoulders, and legs",
    estimatedMinutes: 55,
    exercises: [
      {
        id: "leg-press-friday",
        name: "Leg Press",
        equipment: "Machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 120,
        description:
          "Lower under control and press through your full foot without aggressively locking your knees.",
      },
      {
        id: "wide-grip-pulldown-tuesday",
        name: "Pull-Ups",
        equipment: "Bodyweight or assisted pull-up machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Use a controlled range, keep your shoulders down, and choose bodyweight or assisted resistance as needed.",
      },
      {
        id: "dumbbell-shoulder-press-thursday",
        name: "Dumbbell Shoulder Press",
        equipment: "Dumbbells",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Press the dumbbells overhead with control, keeping your ribs down and avoiding a hard shrug at the top.",
      },
      {
        id: "back-extension",
        name: "Back Extension",
        equipment: "Back extension bench or machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 75,
        description:
          "Move through the hips, keep your spine neutral, and stop when your torso is aligned with your legs.",
      },
    ],
  },

  fullBodyC: {
    label: "Full Body C",
    name: "Full Body C",
    focus: "Starter full-body session with legs, chest, back, and arms",
    estimatedMinutes: 55,
    exercises: [
      {
        id: "leg-extension-wednesday",
        name: "Leg Extension",
        equipment: "Machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Align your knees with the machine pivot and extend smoothly without swinging.",
      },
      {
        id: "incline-machine-press",
        name: "Incline Machine Press",
        equipment: "Machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Use a moderate incline and keep your shoulders supported. Lower under control and press without shrugging.",
      },
      {
        id: "lat-pulldown-tuesday",
        name: "Lat Pulldown",
        equipment: "Cable",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Pull toward your upper chest while keeping your torso controlled and your shoulders down.",
      },
      {
        id: "hammer-curl-tuesday",
        name: "Hammer Curl",
        equipment: "Dumbbells or cable",
        sets: 3,
        repRange: "10–12",
        restSeconds: 60,
        description:
          "Maintain a neutral grip and curl without swinging your torso.",
      },
    ],
  },

  upperBody: {
    label: "Upper Body",
    name: "Upper Body",
    focus: "Balanced upper-body session for chest, back, shoulders, and arms",
    estimatedMinutes: 65,
    exercises: [
      {
        id: "chest-press-thursday",
        name: "Chest Press",
        equipment: "Dumbbells, barbell, smith machine, or machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Press through a controlled range with stable shoulders, using the setup that feels best for today.",
      },
      {
        id: "row-machine-tuesday",
        name: "Row Machine",
        equipment: "Machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Keep your chest stable and drive your elbows backward without shrugging.",
      },
      {
        id: "dumbbell-shoulder-press-thursday",
        name: "Dumbbell Shoulder Press",
        equipment: "Dumbbells",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Press the dumbbells overhead with control, keeping your ribs down and avoiding a hard shrug at the top.",
      },
      {
        id: "lat-pulldown-tuesday",
        name: "Lat Pulldown",
        equipment: "Cable",
        sets: 3,
        repRange: "8–12",
        restSeconds: 90,
        description:
          "Pull toward your upper chest while keeping your torso controlled and your shoulders down.",
      },
      {
        id: "triceps-pushdown-thursday",
        name: "Triceps Pushdown",
        equipment: "Cable, rope, or machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Keep your elbows fixed and fully extend without leaning your whole body into the movement.",
      },
    ],
  },

  lowerBody: {
    label: "Lower Body",
    name: "Lower Body",
    focus: "Balanced lower-body session for quads, hamstrings, glutes, and calves",
    estimatedMinutes: 65,
    exercises: [
      {
        id: "squat-wednesday",
        name: "Squat",
        equipment: "Barbell, Smith machine, or squat machine",
        sets: 3,
        repRange: "6–10",
        restSeconds: 150,
        description:
          "Brace your torso, keep your feet planted, and descend through the deepest comfortable range.",
      },
      {
        id: "seated-leg-curl-wednesday",
        name: "Seated Leg Curl",
        equipment: "Machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Keep your hips against the seat and curl through a controlled range.",
      },
      {
        id: "leg-press-friday",
        name: "Leg Press",
        equipment: "Machine",
        sets: 3,
        repRange: "8–12",
        restSeconds: 120,
        description:
          "Lower under control and press through your full foot without aggressively locking your knees.",
      },
      {
        id: "standing-calf-raise-wednesday",
        name: "Standing Calf Raise",
        equipment: "Machine",
        sets: 3,
        repRange: "10–15",
        restSeconds: 60,
        description:
          "Use a full stretch, rise as high as possible, and avoid bouncing.",
      },
    ],
  },
};

export const workoutDays = Object.keys(workoutProgram);

export const defaultWorkoutSchedule = {
  monday: "monday",
  tuesday: "tuesday",
  wednesday: "wednesday",
  thursday: "thursday",
  friday: "friday",
  saturday: "recovery",
  sunday: "recovery",
};

export const workoutSchedulePresets = [
  {
    id: "fitcircle-5-day",
    name: "Use FitCircle 5-day split",
    description: "Your current push, pull, legs, upper, and lower split.",
    schedule: defaultWorkoutSchedule,
  },
  {
    id: "three-day-full-body",
    name: "3-day full body",
    description: "Simple Monday, Wednesday, Friday training rhythm.",
    schedule: {
      monday: "fullBodyA",
      tuesday: "recovery",
      wednesday: "fullBodyB",
      thursday: "recovery",
      friday: "fullBodyC",
      saturday: "recovery",
      sunday: "recovery",
    },
  },
  {
    id: "four-day-upper-lower",
    name: "4-day upper/lower",
    description: "Upper and lower sessions repeated twice per week.",
    schedule: {
      monday: "upperBody",
      tuesday: "lowerBody",
      wednesday: "recovery",
      thursday: "upperBody",
      friday: "lowerBody",
      saturday: "recovery",
      sunday: "recovery",
    },
  },
  {
    id: "custom",
    name: "Custom",
    description: "Edit days below.",
    schedule: null,
  },
];

export const weekDayLabels = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const weekDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function getWeekdayKey(date = new Date()) {
  const day = date.getDay();

  const dayMap = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };

  return dayMap[day] ?? "monday";
}

export function normalizeWorkoutSchedule(schedule) {
  return Object.fromEntries(
    weekDays.map((day) => {
      const workoutKey = schedule?.[day];

      return [
        day,
        workoutProgram[workoutKey]
          ? workoutKey
          : defaultWorkoutSchedule[day],
      ];
    }),
  );
}

export function getTodayWorkoutKey(schedule, date = new Date()) {
  const weekday = getWeekdayKey(date);
  const normalizedSchedule =
    normalizeWorkoutSchedule(schedule);

  return normalizedSchedule[weekday];
}
