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
import AuthRoute from './routes/AuthRoute';
import AuthCallbackRoute from './routes/AuthCallbackRoute';
import PaywallRoute from './routes/PaywallRoute';
import { RequireAuth, RequireEntitlement } from './routes/guards';

/**
 * Root layout — global chrome (font + bg). Branches inside it:
 *   • AppShell — desktop sidebar+topbar; everyday pages.
 *       - RequireEntitlement guards the paid whole-routes (/exam, /print).
 *       - RequireAuth guards the parent dashboard.
 *   • Full-bleed — /session, /print, /auth/callback render edge-to-edge.
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
            { path: '/results/:sessionId', element: <ResultsRoute /> },
            { path: '/achievements', element: <AchievementsRoute /> },
            { path: '/guides/:guideId', element: <GuideRoute /> },
            { path: '/auth', element: <AuthRoute /> },
            { path: '/paywall', element: <PaywallRoute /> },
            // Legacy PIN gate — kept until the parent area fully moves to auth.
            { path: '/parent-login', element: <ParentLoginRoute /> },
            // Parent dashboard requires a real login.
            {
              element: <RequireAuth />,
              children: [{ path: '/parent', element: <ParentDashboardRoute /> }],
            },
            // Paid whole-routes.
            {
              element: <RequireEntitlement />,
              children: [{ path: '/exam', element: <ExamRoute /> }],
            },
          ],
        },
        // ── Full-bleed routes (no shell) ─────────────────────────────
        { path: '/session', element: <SessionRoute /> },
        { path: '/auth/callback', element: <AuthCallbackRoute /> },
        {
          element: <RequireEntitlement />,
          children: [{ path: '/print/:worksheetSpec', element: <PrintRoute /> }],
        },
        // Unknown paths → home (SPA-friendly, no dead ends for kids)
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  {
    // '/gifted-exam-practice/' on gh-pages today; '/' after the Vercel move.
    basename: import.meta.env.BASE_URL,
  },
);
