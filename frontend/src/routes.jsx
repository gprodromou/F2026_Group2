// routes.jsx: the router. It maps every URL to the page that shows it.
// Two frames (layouts) are used, plus Goals, which brings its own frame (AppShell):
//   Layout      - header with navigation + footer (Landing, workouts, NotFound)
//   AuthLayout  - centred logo + footer, no navigation (Login, Register)
// To add a page later: import it and add one line to the right group.

import { useRoutes } from 'react-router-dom';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import RequireAdmin from './components/RequireAdmin';
import Landing from './pages/Landing';     // Andreas, week 1
import NotFound from './pages/NotFound';   // Andreas, week 1
import Register from './pages/Register';
import Login from './pages/Login';
import TwoFactorSetup from './pages/TwoFactorSetup';
import TwoFactorVerify from './pages/TwoFactorVerify';
import WorkoutNew from './pages/WorkoutNew';
import WorkoutList from './pages/WorkoutList';
import Goals from './pages/Goals';             // Bogdan C, week 6
import TemplateList from './pages/admin/TemplateList'; // Andreas, week 5

export const routes = [
  // Goals and History have their own frame (AppShell: logo, three-line menu, title, footer),
  // so they sit outside Layout: one header and one footer.
  { path: '/goals', element: <Goals /> },               // goals with progress (RQ11, UC07)
  { path: '/workouts', element: <WorkoutList /> },      // history (RQ07), same frame as Goals
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/workouts/new', element: <WorkoutNew /> },
      // Admin only: RequireAdmin sends everyone else away.
      { path: '/admin/templates', element: <RequireAdmin><TemplateList /></RequireAdmin> },
      // Must stay last: any address that matches nothing shows NotFound.
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/register', element: <Register /> },
      { path: '/login', element: <Login /> },
      { path: '/two-factor/setup', element: <TwoFactorSetup /> },   // after signing up
      { path: '/two-factor/verify', element: <TwoFactorVerify /> },  // after each login
    ],
  },
];

// Turns the list above into the component that App.jsx mounts.
export default function AppRoutes() {
  return useRoutes(routes);
}