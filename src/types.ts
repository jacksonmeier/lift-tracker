export type LiftCategory = 'push' | 'pull' | 'legs' | 'core' | 'other';

export type WorkoutStatus = 'in-progress' | 'complete';

export type WorkoutType = 'push' | 'pull' | 'legs';

export interface Lift {
  id: string;
  name: string;
  category: LiftCategory;
  notes?: string;
  archived?: boolean;
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  isWarmup: boolean;
  completed: boolean;
  timestamp: string;
}

export interface Exercise {
  id: string;
  liftId: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  date: string;
  status: WorkoutStatus;
  completedAt?: string;
  type?: WorkoutType;
  exercises: Exercise[];
}

export interface BiometricEntry {
  id: string;
  date: string;
  weight?: number;
  heartRate?: number;
  caloriesBurned?: number;
  workoutLengthMin?: number;
}

export interface AppState {
  lifts: Lift[];
  workouts: Workout[];
  biometrics: BiometricEntry[];
  schemaVersion: 1;
}

export const LIFT_CATEGORIES: readonly LiftCategory[] = [
  'push',
  'pull',
  'legs',
  'core',
  'other',
] as const;

export const WORKOUT_TYPES: readonly WorkoutType[] = ['push', 'pull', 'legs'] as const;
