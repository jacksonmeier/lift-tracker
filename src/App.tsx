import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Workout from './pages/Workout';
import Lifts from './pages/Lifts';
import Settings from './pages/Settings';

const Progress = lazy(() => import('./pages/Progress'));

function ProgressFallback() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center text-sm text-gray-500">
      Loading charts…
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
        <Route path="lifts" element={<Lifts />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
