// App.jsx: the outermost component of the frontend.
//   1. loads the design system (tokens.css), the ONLY place it is imported
//   2. gives the whole app a router
//   4. mounts the route table from routes.jsx

import { BrowserRouter } from 'react-router-dom';
import './styles/tokens.css';
import './styles/theme-petrol.css'; // trial colour scheme: delete this line to go back to green + pink
import AppRoutes from './routes';
import { AuthProvider } from './state/AuthContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
