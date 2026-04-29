export interface MuscleGroupSeed {
  name: string;
  children: string[];
}

export const muscleGroupSeed: MuscleGroupSeed[] = [
  {
    name: 'Chest',
    children: ['Upper Pec', 'Mid/Sternal Pec', 'Lower Pec'],
  },
  {
    name: 'Back',
    children: ['Lats', 'Mid Traps / Rhomboids', 'Lower Traps', 'Teres Major'],
  },
  {
    name: 'Shoulders',
    children: ['Front Delt', 'Side Delt', 'Rear Delt'],
  },
  {
    name: 'Arms',
    children: [
      'Biceps Long Head',
      'Biceps Short Head',
      'Brachialis',
      'Triceps Long Head',
      'Triceps Lateral Head',
      'Forearms',
    ],
  },
  {
    name: 'Legs',
    children: [
      'Quads - Rectus Femoris',
      'Quads - Vastus Lateralis',
      'Quads - VMO',
      'Hamstrings - Biceps Femoris',
      'Hamstrings - Semitendinosus',
      'Glutes - Gluteus Maximus',
      'Glutes - Gluteus Medius',
      'Calves',
    ],
  },
  {
    name: 'Core',
    children: ['Rectus Abdominis', 'Obliques', 'Transverse Abdominis'],
  },
];
