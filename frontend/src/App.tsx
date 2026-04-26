import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';

// Lazy load pages for performance
import Dashboard from './pages/Dashboard';
import Emails from './pages/Emails';
import Documents from './pages/Documents';
import CalendarPage from './pages/Calendar';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="emails" element={<Emails />} />
          <Route path="documents" element={<Documents />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
