import { RouterProvider } from 'react-router';
import { router } from './router';

/**
 * App is now a thin RouterProvider host. The previous view-state machine
 * (useState<AppView> + conditional screen rendering) was dismantled into
 * route adapters under src/routes/ — see src/router.tsx for the route table
 * and src/routes/sessionLaunch.ts for the session config builders.
 */
function App() {
  return <RouterProvider router={router} />;
}

export default App;
