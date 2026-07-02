import { RouterProvider } from 'react-router';
import { AuthProvider } from './hooks/useAuth';
import { router } from './router';

/**
 * App is a thin RouterProvider host wrapped in AuthProvider, so every route
 * (and the entitlement layer) can read the parent's session. The former
 * view-state machine was dismantled into route adapters under src/routes/.
 */
function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
