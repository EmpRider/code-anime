import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Entry point referenced by client/index.html <script type="module" src="/src/main.tsx">.
// Replaces the legacy public/player.js vanilla-JS entry as part of the React rewrite.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);