export interface ExerciseSeed {
  name: string;
  description: string;
  equipment: string;
  movement_pattern: string;
  muscles: { name: string; role: 'primary' | 'secondary' }[];
}

export const exerciseSeed: ExerciseSeed[] = [
  // ── CHEST ──────────────────────────────────────────────────────────────────
  {
    name: 'Flat Barbell Bench Press',
    description: 'Classic compound chest press on a flat bench with a barbell.',
    equipment: 'Barbell',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Mid/Sternal Pec', role: 'primary' },
      { name: 'Front Delt', role: 'secondary' },
      { name: 'Triceps Lateral Head', role: 'secondary' },
    ],
  },
  {
    name: 'Incline Barbell Bench Press',
    description: 'Barbell press on a 30–45° incline bench targeting the upper chest.',
    equipment: 'Barbell',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Upper Pec', role: 'primary' },
      { name: 'Front Delt', role: 'secondary' },
      { name: 'Triceps Long Head', role: 'secondary' },
    ],
  },
  {
    name: 'Decline Barbell Bench Press',
    description: 'Barbell press on a decline bench for lower chest emphasis.',
    equipment: 'Barbell',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Lower Pec', role: 'primary' },
      { name: 'Triceps Lateral Head', role: 'secondary' },
    ],
  },
  {
    name: 'Flat Dumbbell Bench Press',
    description: 'Dumbbell press on a flat bench, allowing greater range of motion.',
    equipment: 'Dumbbell',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Mid/Sternal Pec', role: 'primary' },
      { name: 'Front Delt', role: 'secondary' },
      { name: 'Triceps Lateral Head', role: 'secondary' },
    ],
  },
  {
    name: 'Incline Dumbbell Press',
    description: 'Dumbbell press on a 30–45° incline for upper chest development.',
    equipment: 'Dumbbell',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Upper Pec', role: 'primary' },
      { name: 'Front Delt', role: 'secondary' },
      { name: 'Triceps Long Head', role: 'secondary' },
    ],
  },
  {
    name: 'Decline Dumbbell Press',
    description: 'Dumbbell press on a decline bench targeting the lower chest.',
    equipment: 'Dumbbell',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Lower Pec', role: 'primary' },
      { name: 'Triceps Lateral Head', role: 'secondary' },
    ],
  },
  {
    name: 'Cable Fly (High to Low)',
    description: 'Cable crossover from high pulleys sweeping down, isolating lower chest.',
    equipment: 'Cable',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Lower Pec', role: 'primary' },
      { name: 'Mid/Sternal Pec', role: 'secondary' },
    ],
  },
  {
    name: 'Cable Fly (Low to High)',
    description: 'Cable crossover from low pulleys sweeping up, targeting upper chest.',
    equipment: 'Cable',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Upper Pec', role: 'primary' },
      { name: 'Mid/Sternal Pec', role: 'secondary' },
    ],
  },
  {
    name: 'Pec Deck / Machine Fly',
    description: 'Seated chest fly machine for isolated pec contraction.',
    equipment: 'Machine',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Mid/Sternal Pec', role: 'primary' },
      { name: 'Upper Pec', role: 'secondary' },
    ],
  },
  {
    name: 'Dumbbell Fly',
    description: 'Lying dumbbell fly on a flat bench for a deep pec stretch.',
    equipment: 'Dumbbell',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Mid/Sternal Pec', role: 'primary' },
      { name: 'Upper Pec', role: 'secondary' },
      { name: 'Lower Pec', role: 'secondary' },
    ],
  },
  {
    name: 'Push-Up',
    description: 'Bodyweight pushing exercise for chest, shoulders, and triceps.',
    equipment: 'Bodyweight',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Mid/Sternal Pec', role: 'primary' },
      { name: 'Front Delt', role: 'secondary' },
      { name: 'Triceps Lateral Head', role: 'secondary' },
    ],
  },

  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  {
    name: 'Overhead Barbell Press',
    description: 'Standing or seated barbell press overhead for shoulder mass.',
    equipment: 'Barbell',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Front Delt', role: 'primary' },
      { name: 'Side Delt', role: 'secondary' },
      { name: 'Triceps Lateral Head', role: 'secondary' },
    ],
  },
  {
    name: 'Dumbbell Shoulder Press',
    description: 'Seated or standing dumbbell overhead press.',
    equipment: 'Dumbbell',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Front Delt', role: 'primary' },
      { name: 'Side Delt', role: 'secondary' },
      { name: 'Triceps Long Head', role: 'secondary' },
    ],
  },
  {
    name: 'Arnold Press',
    description: 'Rotating dumbbell press that hits all three deltoid heads.',
    equipment: 'Dumbbell',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Front Delt', role: 'primary' },
      { name: 'Side Delt', role: 'secondary' },
    ],
  },
  {
    name: 'Lateral Raise',
    description: 'Dumbbell lateral raise for side deltoid isolation.',
    equipment: 'Dumbbell',
    movement_pattern: 'Isolation',
    muscles: [{ name: 'Side Delt', role: 'primary' }],
  },
  {
    name: 'Cable Lateral Raise',
    description: 'Cable lateral raise for constant tension on the side delt.',
    equipment: 'Cable',
    movement_pattern: 'Isolation',
    muscles: [{ name: 'Side Delt', role: 'primary' }],
  },
  {
    name: 'Dumbbell Front Raise',
    description: 'Raises dumbbells forward to shoulder height to target front delts.',
    equipment: 'Dumbbell',
    movement_pattern: 'Isolation',
    muscles: [{ name: 'Front Delt', role: 'primary' }],
  },

  // ── TRICEPS ─────────────────────────────────────────────────────────────────
  {
    name: 'Tricep Pushdown (Cable)',
    description: 'Cable pushdown with rope or bar targeting the triceps.',
    equipment: 'Cable',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Triceps Lateral Head', role: 'primary' },
      { name: 'Triceps Long Head', role: 'secondary' },
    ],
  },
  {
    name: 'Skull Crushers (EZ Bar)',
    description: 'Lying EZ bar extension for tricep mass.',
    equipment: 'Barbell',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Triceps Long Head', role: 'primary' },
      { name: 'Triceps Lateral Head', role: 'secondary' },
    ],
  },
  {
    name: 'Overhead Tricep Extension',
    description: 'Dumbbell or cable extension overhead to maximize long head stretch.',
    equipment: 'Dumbbell',
    movement_pattern: 'Isolation',
    muscles: [{ name: 'Triceps Long Head', role: 'primary' }],
  },
  {
    name: 'Close-Grip Bench Press',
    description: 'Barbell bench press with narrow grip for tricep emphasis.',
    equipment: 'Barbell',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Triceps Lateral Head', role: 'primary' },
      { name: 'Mid/Sternal Pec', role: 'secondary' },
      { name: 'Front Delt', role: 'secondary' },
    ],
  },
  {
    name: 'Tricep Dips',
    description: 'Bodyweight or weighted dips on parallel bars for triceps and lower chest.',
    equipment: 'Bodyweight',
    movement_pattern: 'Push',
    muscles: [
      { name: 'Triceps Long Head', role: 'primary' },
      { name: 'Lower Pec', role: 'secondary' },
      { name: 'Front Delt', role: 'secondary' },
    ],
  },

  // ── BACK ────────────────────────────────────────────────────────────────────
  {
    name: 'Pull-Up',
    description: 'Overhand bodyweight pull-up for lat width and upper back strength.',
    equipment: 'Bodyweight',
    movement_pattern: 'Pull',
    muscles: [
      { name: 'Lats', role: 'primary' },
      { name: 'Biceps Long Head', role: 'secondary' },
      { name: 'Teres Major', role: 'secondary' },
    ],
  },
  {
    name: 'Chin-Up',
    description: 'Underhand grip pull-up emphasizing biceps and lats.',
    equipment: 'Bodyweight',
    movement_pattern: 'Pull',
    muscles: [
      { name: 'Lats', role: 'primary' },
      { name: 'Biceps Short Head', role: 'secondary' },
      { name: 'Biceps Long Head', role: 'secondary' },
    ],
  },
  {
    name: 'Lat Pulldown (Wide Grip)',
    description: 'Cable pulldown with wide overhand grip for lat width.',
    equipment: 'Cable',
    movement_pattern: 'Pull',
    muscles: [
      { name: 'Lats', role: 'primary' },
      { name: 'Biceps Long Head', role: 'secondary' },
      { name: 'Teres Major', role: 'secondary' },
    ],
  },
  {
    name: 'Lat Pulldown (Close Grip)',
    description: 'Cable pulldown with close neutral grip for lat thickness.',
    equipment: 'Cable',
    movement_pattern: 'Pull',
    muscles: [
      { name: 'Lats', role: 'primary' },
      { name: 'Biceps Short Head', role: 'secondary' },
    ],
  },
  {
    name: 'Seated Cable Row',
    description: 'Horizontal cable row for mid-back and rhomboid development.',
    equipment: 'Cable',
    movement_pattern: 'Pull',
    muscles: [
      { name: 'Mid Traps / Rhomboids', role: 'primary' },
      { name: 'Lats', role: 'secondary' },
      { name: 'Biceps Short Head', role: 'secondary' },
    ],
  },
  {
    name: 'Bent Over Barbell Row',
    description: 'Hinging row with a barbell for back thickness and strength.',
    equipment: 'Barbell',
    movement_pattern: 'Pull',
    muscles: [
      { name: 'Mid Traps / Rhomboids', role: 'primary' },
      { name: 'Lats', role: 'secondary' },
      { name: 'Biceps Long Head', role: 'secondary' },
    ],
  },
  {
    name: 'Dumbbell Row',
    description: 'Single-arm dumbbell row for unilateral lat and rhomboid work.',
    equipment: 'Dumbbell',
    movement_pattern: 'Pull',
    muscles: [
      { name: 'Lats', role: 'primary' },
      { name: 'Mid Traps / Rhomboids', role: 'secondary' },
      { name: 'Biceps Long Head', role: 'secondary' },
    ],
  },
  {
    name: 'T-Bar Row',
    description: 'Supported or unsupported T-bar row for back thickness.',
    equipment: 'Barbell',
    movement_pattern: 'Pull',
    muscles: [
      { name: 'Mid Traps / Rhomboids', role: 'primary' },
      { name: 'Lats', role: 'secondary' },
      { name: 'Biceps Long Head', role: 'secondary' },
    ],
  },
  {
    name: 'Face Pull',
    description: 'Cable pull to the face for rear delt and external rotator health.',
    equipment: 'Cable',
    movement_pattern: 'Pull',
    muscles: [
      { name: 'Rear Delt', role: 'primary' },
      { name: 'Mid Traps / Rhomboids', role: 'secondary' },
    ],
  },
  {
    name: 'Rear Delt Dumbbell Fly',
    description: 'Bent-over dumbbell raise for rear deltoid isolation.',
    equipment: 'Dumbbell',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Rear Delt', role: 'primary' },
      { name: 'Mid Traps / Rhomboids', role: 'secondary' },
    ],
  },
  {
    name: 'Cable Rear Delt Fly',
    description: 'Cable crossover rear delt fly for constant tension.',
    equipment: 'Cable',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Rear Delt', role: 'primary' },
      { name: 'Mid Traps / Rhomboids', role: 'secondary' },
    ],
  },
  {
    name: 'Barbell Shrug',
    description: 'Heavy barbell shrug for upper trapezius development.',
    equipment: 'Barbell',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Mid Traps / Rhomboids', role: 'primary' },
      { name: 'Lower Traps', role: 'secondary' },
    ],
  },
  {
    name: 'Dumbbell Shrug',
    description: 'Dumbbell shrug for upper trapezius isolation.',
    equipment: 'Dumbbell',
    movement_pattern: 'Isolation',
    muscles: [{ name: 'Mid Traps / Rhomboids', role: 'primary' }],
  },

  // ── BICEPS ──────────────────────────────────────────────────────────────────
  {
    name: 'Barbell Bicep Curl',
    description: 'Standing barbell curl for bilateral bicep mass.',
    equipment: 'Barbell',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Biceps Long Head', role: 'primary' },
      { name: 'Brachialis', role: 'secondary' },
    ],
  },
  {
    name: 'Dumbbell Bicep Curl',
    description: 'Standing dumbbell curl with supination for full bicep development.',
    equipment: 'Dumbbell',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Biceps Long Head', role: 'primary' },
      { name: 'Brachialis', role: 'secondary' },
    ],
  },
  {
    name: 'Hammer Curl',
    description: 'Neutral-grip curl that emphasizes the brachialis and brachioradialis.',
    equipment: 'Dumbbell',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Brachialis', role: 'primary' },
      { name: 'Biceps Long Head', role: 'secondary' },
    ],
  },
  {
    name: 'Preacher Curl',
    description: 'Preacher bench curl for peak bicep contraction with less cheating.',
    equipment: 'Barbell',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Biceps Short Head', role: 'primary' },
      { name: 'Brachialis', role: 'secondary' },
    ],
  },
  {
    name: 'Incline Dumbbell Curl',
    description: 'Lying on an incline to stretch the long head of the bicep.',
    equipment: 'Dumbbell',
    movement_pattern: 'Isolation',
    muscles: [{ name: 'Biceps Long Head', role: 'primary' }],
  },
  {
    name: 'Cable Bicep Curl',
    description: 'Low-pulley cable curl for constant tension on the bicep.',
    equipment: 'Cable',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Biceps Short Head', role: 'primary' },
      { name: 'Brachialis', role: 'secondary' },
    ],
  },

  // ── LEGS ────────────────────────────────────────────────────────────────────
  {
    name: 'Barbell Back Squat',
    description: 'King of quad exercises — barbell on traps with a full squat.',
    equipment: 'Barbell',
    movement_pattern: 'Squat',
    muscles: [
      { name: 'Quads - Rectus Femoris', role: 'primary' },
      { name: 'Quads - Vastus Lateralis', role: 'secondary' },
      { name: 'Glutes - Gluteus Maximus', role: 'secondary' },
      { name: 'Hamstrings - Biceps Femoris', role: 'secondary' },
    ],
  },
  {
    name: 'Front Squat',
    description: 'Barbell in the front rack position for greater quad emphasis.',
    equipment: 'Barbell',
    movement_pattern: 'Squat',
    muscles: [
      { name: 'Quads - Rectus Femoris', role: 'primary' },
      { name: 'Quads - VMO', role: 'secondary' },
    ],
  },
  {
    name: 'Leg Press',
    description: 'Machine leg press for quad volume with reduced spinal load.',
    equipment: 'Machine',
    movement_pattern: 'Squat',
    muscles: [
      { name: 'Quads - Vastus Lateralis', role: 'primary' },
      { name: 'Glutes - Gluteus Maximus', role: 'secondary' },
      { name: 'Quads - Rectus Femoris', role: 'secondary' },
    ],
  },
  {
    name: 'Hack Squat',
    description: 'Machine squat with upright torso for VMO and quad isolation.',
    equipment: 'Machine',
    movement_pattern: 'Squat',
    muscles: [
      { name: 'Quads - VMO', role: 'primary' },
      { name: 'Quads - Vastus Lateralis', role: 'secondary' },
    ],
  },
  {
    name: 'Romanian Deadlift',
    description: 'Hip hinge with slight knee bend for hamstring and glute stretch.',
    equipment: 'Barbell',
    movement_pattern: 'Hinge',
    muscles: [
      { name: 'Hamstrings - Biceps Femoris', role: 'primary' },
      { name: 'Glutes - Gluteus Maximus', role: 'secondary' },
      { name: 'Lower Traps', role: 'secondary' },
    ],
  },
  {
    name: 'Deadlift',
    description: 'Full deadlift from the floor — full posterior chain strength exercise.',
    equipment: 'Barbell',
    movement_pattern: 'Hinge',
    muscles: [
      { name: 'Hamstrings - Biceps Femoris', role: 'primary' },
      { name: 'Glutes - Gluteus Maximus', role: 'secondary' },
      { name: 'Mid Traps / Rhomboids', role: 'secondary' },
      { name: 'Lower Traps', role: 'secondary' },
    ],
  },
  {
    name: 'Hip Thrust',
    description: 'Barbell or bodyweight hip thrust for maximal glute activation.',
    equipment: 'Barbell',
    movement_pattern: 'Hinge',
    muscles: [
      { name: 'Glutes - Gluteus Maximus', role: 'primary' },
      { name: 'Hamstrings - Biceps Femoris', role: 'secondary' },
    ],
  },
  {
    name: 'Glute Bridge',
    description: 'Floor glute bridge for glute activation and posterior pelvic tilt.',
    equipment: 'Bodyweight',
    movement_pattern: 'Hinge',
    muscles: [
      { name: 'Glutes - Gluteus Maximus', role: 'primary' },
      { name: 'Hamstrings - Semitendinosus', role: 'secondary' },
    ],
  },
  {
    name: 'Leg Curl (Machine)',
    description: 'Lying or seated machine leg curl for hamstring isolation.',
    equipment: 'Machine',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Hamstrings - Semitendinosus', role: 'primary' },
      { name: 'Hamstrings - Biceps Femoris', role: 'secondary' },
      { name: 'Calves', role: 'secondary' },
    ],
  },
  {
    name: 'Leg Extension',
    description: 'Machine leg extension for isolated quad work.',
    equipment: 'Machine',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Quads - VMO', role: 'primary' },
      { name: 'Quads - Rectus Femoris', role: 'secondary' },
    ],
  },
  {
    name: 'Bulgarian Split Squat',
    description: 'Rear-foot elevated split squat for unilateral quad and glute strength.',
    equipment: 'Dumbbell',
    movement_pattern: 'Squat',
    muscles: [
      { name: 'Quads - Rectus Femoris', role: 'primary' },
      { name: 'Glutes - Gluteus Maximus', role: 'secondary' },
      { name: 'Quads - VMO', role: 'secondary' },
    ],
  },
  {
    name: 'Lunges',
    description: 'Walking or stationary lunges for quad and glute development.',
    equipment: 'Bodyweight',
    movement_pattern: 'Squat',
    muscles: [
      { name: 'Quads - Rectus Femoris', role: 'primary' },
      { name: 'Glutes - Gluteus Maximus', role: 'secondary' },
      { name: 'Hamstrings - Biceps Femoris', role: 'secondary' },
    ],
  },
  {
    name: 'Calf Raise (Standing)',
    description: 'Standing single or double-leg calf raise for gastrocnemius size.',
    equipment: 'Machine',
    movement_pattern: 'Isolation',
    muscles: [{ name: 'Calves', role: 'primary' }],
  },
  {
    name: 'Calf Raise (Seated)',
    description: 'Seated calf raise targeting the soleus under the gastrocnemius.',
    equipment: 'Machine',
    movement_pattern: 'Isolation',
    muscles: [{ name: 'Calves', role: 'primary' }],
  },
  {
    name: 'Hip Abduction Machine',
    description: 'Seated hip abduction machine for gluteus medius isolation.',
    equipment: 'Machine',
    movement_pattern: 'Isolation',
    muscles: [{ name: 'Glutes - Gluteus Medius', role: 'primary' }],
  },
  {
    name: 'Cable Kickback',
    description: 'Cable or bodyweight glute kickback for posterior glute isolation.',
    equipment: 'Cable',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Glutes - Gluteus Maximus', role: 'primary' },
      { name: 'Hamstrings - Semitendinosus', role: 'secondary' },
    ],
  },

  // ── CORE ────────────────────────────────────────────────────────────────────
  {
    name: 'Plank',
    description: 'Isometric hold for deep core and transverse abdominis activation.',
    equipment: 'Bodyweight',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Transverse Abdominis', role: 'primary' },
      { name: 'Rectus Abdominis', role: 'secondary' },
      { name: 'Obliques', role: 'secondary' },
    ],
  },
  {
    name: 'Crunches',
    description: 'Floor crunch for rectus abdominis isolation.',
    equipment: 'Bodyweight',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Rectus Abdominis', role: 'primary' },
      { name: 'Obliques', role: 'secondary' },
    ],
  },
  {
    name: 'Russian Twist',
    description: 'Seated rotational movement for oblique development.',
    equipment: 'Bodyweight',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Obliques', role: 'primary' },
      { name: 'Rectus Abdominis', role: 'secondary' },
    ],
  },
  {
    name: 'Hanging Leg Raise',
    description: 'Hanging from a bar, raising legs for lower ab and hip flexor work.',
    equipment: 'Bodyweight',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Rectus Abdominis', role: 'primary' },
      { name: 'Obliques', role: 'secondary' },
      { name: 'Transverse Abdominis', role: 'secondary' },
    ],
  },
  {
    name: 'Ab Wheel Rollout',
    description: 'Ab wheel extension for full core anti-extension strength.',
    equipment: 'Bodyweight',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Transverse Abdominis', role: 'primary' },
      { name: 'Rectus Abdominis', role: 'secondary' },
    ],
  },
  {
    name: 'Cable Crunch',
    description: 'Weighted cable crunch for progressive overload on the rectus abdominis.',
    equipment: 'Cable',
    movement_pattern: 'Isolation',
    muscles: [
      { name: 'Rectus Abdominis', role: 'primary' },
      { name: 'Obliques', role: 'secondary' },
    ],
  },
];
