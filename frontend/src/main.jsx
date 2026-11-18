// main.jsx: the starting point of the website in the browser (Bogdan C, week 5).
// index.html loads this file. It finds the empty <div id="root"> on the page and asks
// React to draw App.jsx inside it. Everything else (router, AuthProvider, design tokens)
// is already set up inside App.jsx, so this file stays this small.
//
// Jest never loads this file: the tests render App or single pages directly.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(
  // StrictMode only adds extra checks and warnings while developing; users see no difference.
  <StrictMode>
    <App />
  </StrictMode>
);
