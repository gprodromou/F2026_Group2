// routes.jsx: the router. It maps every URL to the page that shows it.
// Two frames (layouts) are used:
//   Layout      - header with navigation + footer (Landing, NotFound)
//   AuthLayout  - centred logo + footer, no navigation (Login, Register)
// To add a page later: import it and add one line to the right group.

import { useRoutes } from 'react-router-dom';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import Landing from './pages/Landing';     // Andreas, week 1
import NotFound from './pages/NotFound';   // Andreas, week 1
import Register from './pages/Register';
import Login from './pages/Login';

export const routes = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Landing /> },
      // Must stay last: any address that matches nothing shows NotFound.
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/register', element: <Register /> },
      { path: '/login', element: <Login /> },
    ],
  },
];

// Turns the list above into the component that App.jsx mounts.
export default function AppRoutes() {
  return useRoutes(routes);
}
