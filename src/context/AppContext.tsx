import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { AppState, Exercise, Lift, Workout, WorkoutSet } from '../types';
import { load, save } from '../storage';
import { uuid } from '../lib/uuid';

type Action =
  | { type: 'REPLACE_STATE'; state: AppState }
  | { type: 'ADD_LIFT'; lift: Lift }
  | { type: 'UPDATE_LIFT'; lift: Lift }
  | { type: 'DELETE_LIFT'; id: string }
  | { type: 'START_WORKOUT'; workout: Workout }
  | { type: 'FINISH_WORKOUT'; id: string; completedAt: string }
  | { type: 'ADD_EXERCISE'; workoutId: string; exercise: Exercise }
  | { type: 'REMOVE_EXERCISE'; workoutId: string; exerciseId: string }
  | { type: 'ADD_SET'; workoutId: string; exerciseId: string; id: string; timestamp: string }
  | { type: 'UPDATE_SET'; workoutId: string; exerciseId: string; set: WorkoutSet }
  | { type: 'DELETE_SET'; workoutId: string; exerciseId: string; setId: string }
  | { type: 'DELETE_WORKOUT'; id: string };

function mapWorkout(state: AppState, id: string, fn: (w: Workout) => Workout): AppState {
  return { ...state, workouts: state.workouts.map((w) => (w.id === id ? fn(w) : w)) };
}

function mapExercise(workout: Workout, id: string, fn: (e: Exercise) => Exercise): Workout {
  return { ...workout, exercises: workout.exercises.map((e) => (e.id === id ? fn(e) : e)) };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'REPLACE_STATE':
      return action.state;

    case 'ADD_LIFT':
      return { ...state, lifts: [...state.lifts, action.lift] };
    case 'UPDATE_LIFT':
      return {
        ...state,
        lifts: state.lifts.map((l) => (l.id === action.lift.id ? action.lift : l)),
      };
    case 'DELETE_LIFT':
      return { ...state, lifts: state.lifts.filter((l) => l.id !== action.id) };

    case 'START_WORKOUT':
      return { ...state, workouts: [...state.workouts, action.workout] };

    case 'FINISH_WORKOUT':
      return mapWorkout(state, action.id, (w) => ({
        ...w,
        status: 'complete',
        completedAt: action.completedAt,
      }));

    case 'ADD_EXERCISE':
      return mapWorkout(state, action.workoutId, (w) => ({
        ...w,
        exercises: [...w.exercises, action.exercise],
      }));

    case 'REMOVE_EXERCISE':
      return mapWorkout(state, action.workoutId, (w) => ({
        ...w,
        exercises: w.exercises.filter((e) => e.id !== action.exerciseId),
      }));

    case 'ADD_SET':
      return mapWorkout(state, action.workoutId, (w) =>
        mapExercise(w, action.exerciseId, (e) => {
          const last = e.sets[e.sets.length - 1];
          const newSet: WorkoutSet = {
            id: action.id,
            weight: last?.weight ?? 0,
            reps: last?.reps ?? 0,
            isWarmup: last?.isWarmup ?? false,
            completed: false,
            timestamp: action.timestamp,
          };
          return { ...e, sets: [...e.sets, newSet] };
        }),
      );

    case 'UPDATE_SET':
      return mapWorkout(state, action.workoutId, (w) =>
        mapExercise(w, action.exerciseId, (e) => ({
          ...e,
          sets: e.sets.map((s) => (s.id === action.set.id ? action.set : s)),
        })),
      );

    case 'DELETE_SET':
      return mapWorkout(state, action.workoutId, (w) =>
        mapExercise(w, action.exerciseId, (e) => ({
          ...e,
          sets: e.sets.filter((s) => s.id !== action.setId),
        })),
      );

    case 'DELETE_WORKOUT':
      return { ...state, workouts: state.workouts.filter((w) => w.id !== action.id) };
  }
}

interface Actions {
  addLift: (lift: Omit<Lift, 'id'>) => Lift;
  updateLift: (lift: Lift) => void;
  deleteLift: (id: string) => void;
  replaceState: (state: AppState) => void;

  startWorkout: () => Workout;
  finishWorkout: (id: string) => void;
  deleteWorkout: (id: string) => void;
  addExercise: (workoutId: string, liftId: string) => Exercise;
  removeExercise: (workoutId: string, exerciseId: string) => void;
  addSet: (workoutId: string, exerciseId: string) => void;
  updateSet: (workoutId: string, exerciseId: string, set: WorkoutSet) => void;
  deleteSet: (workoutId: string, exerciseId: string, setId: string) => void;
}

interface AppContextValue {
  state: AppState;
  actions: Actions;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    save(state);
  }, [state]);

  const actions = useMemo<Actions>(
    () => ({
      addLift: (lift) => {
        const newLift: Lift = { ...lift, id: uuid() };
        dispatch({ type: 'ADD_LIFT', lift: newLift });
        return newLift;
      },
      updateLift: (lift) => dispatch({ type: 'UPDATE_LIFT', lift }),
      deleteLift: (id) => dispatch({ type: 'DELETE_LIFT', id }),
      replaceState: (next) => dispatch({ type: 'REPLACE_STATE', state: next }),

      startWorkout: () => {
        const workout: Workout = {
          id: uuid(),
          date: new Date().toISOString(),
          status: 'in-progress',
          exercises: [],
        };
        dispatch({ type: 'START_WORKOUT', workout });
        return workout;
      },
      finishWorkout: (id) =>
        dispatch({ type: 'FINISH_WORKOUT', id, completedAt: new Date().toISOString() }),
      deleteWorkout: (id) => dispatch({ type: 'DELETE_WORKOUT', id }),
      addExercise: (workoutId, liftId) => {
        const exercise: Exercise = { id: uuid(), liftId, sets: [] };
        dispatch({ type: 'ADD_EXERCISE', workoutId, exercise });
        return exercise;
      },
      removeExercise: (workoutId, exerciseId) =>
        dispatch({ type: 'REMOVE_EXERCISE', workoutId, exerciseId }),
      addSet: (workoutId, exerciseId) =>
        dispatch({
          type: 'ADD_SET',
          workoutId,
          exerciseId,
          id: uuid(),
          timestamp: new Date().toISOString(),
        }),
      updateSet: (workoutId, exerciseId, set) =>
        dispatch({ type: 'UPDATE_SET', workoutId, exerciseId, set }),
      deleteSet: (workoutId, exerciseId, setId) =>
        dispatch({ type: 'DELETE_SET', workoutId, exerciseId, setId }),
    }),
    [],
  );

  const value = useMemo<AppContextValue>(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
