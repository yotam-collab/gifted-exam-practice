import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import AppShell from './components/layout/AppShell';
import HomeRoute from './routes/HomeRoute';
import PracticeRoute from './routes/PracticeRoute';
import ExamRoute from './routes/ExamRoute';
import SessionRoute from './routes/SessionRoute';
import ResultsRoute from './routes/ResultsRoute';
import AchievementsRoute from './routes/AchievementsRoute';
import { ParentLoginRoute, ParentDashboardRoute } from './routes/ParentRoutes';
import LibraryRoute from './routes/LibraryRoute';
import CategoryRoute from './routes/CategoryRoute';
import SubtopicRoute from './routes/SubtopicRoute';
import GuideRoute from './routes/GuideRoute';
import PrintRoute from './routes/PrintRoute';

/**
 * Root layout — global chrome (font link + bg) shared by every route.
 * Two layout branches sit inside it:
 *   • AppShell — desktop sidebar+topbar; wraps everyday pages.
 *   • Full-bleed — /session and /print render edge-to-edge (no shell), so a
 *     kid taking a test or an adult printing a worksheet gets a clean canvas.
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
        // ── Shell routes (desktop sidebar + topbar) ──────────────────
        {
          element: <AppShell />,
          children: [
            { path: '/', element: <HomeRoute /> },
            { path: '/library', element: <LibraryRoute /> },
            { path: '/library/:categoryId', element: <CategoryRoute /> },
            { path: '/library/:categoryId/:subtopicId', element: <SubtopicRoute /> },
            { path: '/practice', element: <PracticeRoute /> },
            { path: '/exam', element: <ExamRoute /> },
            { path: '/results/:sessionId', element: <ResultsRoute /> },
            { path: '/achievements', element: <AchievementsRoute /> },
            { path: '/guides/:guideId', element: <GuideRoute /> },
            { path: '/parent-login', element: <ParentLoginRoute /> },
            { path: '/parent', element: <ParentDashboardRoute /> },
          ],
        },
        // ── Full-bleed routes (no shell) ─────────────────────────────
        { path: '/session', element: <SessionRoute /> },
        { path: '/print/:worksheetSpec', element: <PrintRoute /> },
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
