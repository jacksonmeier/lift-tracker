import type { WorkoutType } from '../types';

export function workoutTypeLabel(type: WorkoutType): string {
  switch (type) {
    case 'push':
      return 'Push';
    case 'pull':
      return 'Pull';
    case 'legs':
      return 'Legs';
  }
}

export function workoutTypePillClasses(type: WorkoutType): string {
  switch (type) {
    case 'push':
      return 'border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300';
    case 'pull':
      return 'border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300';
    case 'legs':
      return 'border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-300';
  }
}
