import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Workout from './pages/Workout';
import Lifts from './pages/Lifts';
import Settings from './pages/Settings';

const Progress = lazy(() => import('./pages/Progress'));
const Stats = lazy(() => import('./pages/Stats'));

function ProgressFallback() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center">
      <div className="glass-quiet inline-block rounded-full px-4 py-2 text-[13px] text-[var(--text-muted)]">
        Loading charts…
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="workout/:id" element={<Workout />} />
        <Route
          path="progress"
          element={
            <Suspense fallback={<ProgressFallback />}>
              <Progress />
            </Suspense>
          }
        />
        <Route
          path="stats"
          element={
            <Suspense fallback={<ProgressFallback />}>
              <Stats />
            </Suspense>
          }
        />
        <Route path="lifts" element={<Lifts />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
