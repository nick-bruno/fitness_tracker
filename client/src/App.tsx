import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import ExerciseLibraryPage from './pages/ExerciseLibraryPage';
import LogWorkoutPage from './pages/LogWorkoutPage';
import WorkoutHistoryPage from './pages/WorkoutHistoryPage';
import RecommendationsPage from './pages/RecommendationsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/exercises" element={<ExerciseLibraryPage />} />
          <Route path="/log" element={<LogWorkoutPage />} />
          <Route path="/log/:workoutId" element={<LogWorkoutPage />} />
          <Route path="/history" element={<WorkoutHistoryPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
