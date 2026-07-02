import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import HomeRoute from './routes/HomeRoute';
import PracticeRoute from './routes/PracticeRoute';
import ExamRoute from './routes/ExamRoute';
import SessionRoute from './routes/SessionRoute';
import ResultsRoute from './routes/ResultsRoute';
import AchievementsRoute from './routes/AchievementsRoute';
import { ParentLoginRoute, ParentDashboardRoute } from './routes/ParentRoutes';

/**
 * Root layout — global chrome shared by every route. The desktop AppShell
 * (sidebar + topbar, build step 2) mounts here; full-bleed routes (/session,
 * /print, /auth/callback) are declared as siblings outside the shell.
 */
function RootLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <link
        href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <Outlet />
    </div>
  );
}

export const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        { path: '/', element: <HomeRoute /> },
        { path: '/practice', element: <PracticeRoute /> },
        { path: '/exam', element: <ExamRoute /> },
        { path: '/session', element: <SessionRoute /> },
        { path: '/results/:sessionId', element: <ResultsRoute /> },
        { path: '/achievements', element: <AchievementsRoute /> },
        { path: '/parent-login', element: <ParentLoginRoute /> },
        { path: '/parent', element: <ParentDashboardRoute /> },
        // Unknown paths → home (SPA-friendly, no dead ends for kids)
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  {
    // '/gifted-exam-practice/' on gh-pages today; '/' after the Vercel move —
    // one env change, zero code changes.
    basename: import.meta.env.BASE_URL,
  },
);
