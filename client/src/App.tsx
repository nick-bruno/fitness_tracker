import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import ExerciseLibraryPage from './pages/ExerciseLibraryPage';
import LogWorkoutPage from './pages/LogWorkoutPage';
import WorkoutHistoryPage from './pages/WorkoutHistoryPage';
import RecommendationsPage from './pages/RecommendationsPage';
import LogCardioPage from './pages/LogCardioPage';
import CardioHistoryPage from './pages/CardioHistoryPage';
import LogActivityPage from './pages/LogActivityPage';
import ActivityHistoryPage from './pages/ActivityHistoryPage';

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
          <Route path="/log-run" element={<LogCardioPage activityType="run" />} />
          <Route path="/log-run/:cardioId" element={<LogCardioPage activityType="run" />} />
          <Route path="/runs" element={<CardioHistoryPage activityType="run" />} />
          <Route path="/log-row" element={<LogCardioPage activityType="row" />} />
          <Route path="/log-row/:cardioId" element={<LogCardioPage activityType="row" />} />
          <Route path="/rows" element={<CardioHistoryPage activityType="row" />} />
          <Route path="/log-activity" element={<LogActivityPage />} />
          <Route path="/log-activity/:activityId" element={<LogActivityPage />} />
          <Route path="/activities" element={<ActivityHistoryPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
